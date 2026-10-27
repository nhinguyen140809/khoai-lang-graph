import type { Artifact, ArtifactItem } from '@/modules/artifact/entities'
import { allowedValues, itemHierarchy, reviewStatuses } from '@/modules/artifact/entities'
import type { ContentSchema, ContentValues } from '@/modules/workflow/entities'
import type { FieldProblem } from '@/shared/api/error'
import { isString } from '@/shared/lib/guards'
import { descendantsOf } from '@/shared/lib/hierarchy'

import {
  choice,
  isSentButInvalid,
  jsonObject,
  optionalText,
  optionalTextProblem,
  positiveInteger,
  positiveIntegerProblem,
  requiredText,
  schemaProblems,
} from '../shared/http/validation'
import { findKind, itemKindsOf } from '../workflow/artifact-kinds.fixtures'
import { allArtifacts, allItems, childrenOf, findItem } from './artifacts.lookup'
import type { ArtifactChangeSet, ItemChangeSet, NewItemRecord } from './artifacts.types'

// What the bodies of the requests to the artifacts and the items may hold. A function that reads a
// whole body, `validate<Body>`, gives the record that the body describes, or the problems of its
// fields; the others give only problems.

/**
 * The problems of a content against its schema, at the fields of the body of the request: the
 * keywords of the schema, and the values of a field that takes them from an artifact of the project.
 */
export function contentProblems(
  schema: ContentSchema,
  content: ContentValues,
  projectId: string,
): FieldProblem[] {
  const artifacts = allArtifacts().filter((artifact) => artifact.project_id === projectId)
  const outsideList = Object.entries(schema.properties ?? {}).flatMap(([name, property]) => {
    const options = allowedValues(artifacts, property['x-value-from'] ?? null)
    const values = [content[name]].flat().filter(isString)
    return values.some((value) => !options.includes(value)) && options.length > 0
      ? [{ field: `content.${name}`, message: 'Choose one of the values of the plan.' }]
      : []
  })
  return [...schemaProblems(schema, content, 'content'), ...outsideList]
}

/** The problems of the `content` and the `review_status` of a change: each is left out or whole. */
export function changeProblems(content: unknown, reviewStatus: unknown): FieldProblem[] {
  const problems: FieldProblem[] = []
  if (isSentButInvalid(content, jsonObject)) {
    problems.push({ field: 'content', message: 'Send the fields of the content.' })
  }
  if (isSentButInvalid(reviewStatus, (value) => choice(reviewStatuses, value))) {
    problems.push({ field: 'review_status', message: 'Choose a review status.' })
  }
  return problems
}

/** The key prefix of a new item of a kind, or null when the user cannot add one of that kind. */
export function newKeyPrefix(schema: ContentSchema, content: ContentValues) {
  const prefix = schema['x-key-prefix']
  if (prefix === undefined) return null
  if (/^[A-Z]+$/.test(prefix)) return prefix
  // A kind that names two prefixes in words: a backlog item is an epic or a user story.
  return content.item_type === 'epic' ? 'EP' : 'US'
}

// The new item that the body of POST /artifacts/{artifact_id}/items describes, or the problems of
// its fields.
export function validateNewItem(
  artifact: Artifact,
  body: Record<string, unknown>,
): { item: NewItemRecord } | { problems: FieldProblem[] } {
  const { kind, content, parent_item_id: parentItemId } = body
  const fields = jsonObject(content)
  const itemKind = itemKindsOf(artifact.kind).find((entry) => entry.kind === kind)
  const parent = isString(parentItemId) ? findItem(parentItemId) : undefined
  const problems: FieldProblem[] = []
  if (itemKind === undefined) {
    problems.push({ field: 'kind', message: 'The artifact does not hold this kind.' })
  }
  if (fields === undefined) {
    problems.push({ field: 'content', message: 'Send the fields of the content.' })
  }
  if (parentItemId != null && parent?.artifact_id !== artifact.id) {
    problems.push({ field: 'parent_item_id', message: 'Choose an item of the artifact.' })
  }
  if (itemKind !== undefined && fields !== undefined) {
    problems.push(...contentProblems(itemKind.schema, fields, artifact.project_id))
  }
  const keyPrefix =
    itemKind === undefined || fields === undefined ? null : newKeyPrefix(itemKind.schema, fields)
  if (itemKind !== undefined && keyPrefix === null) {
    problems.push({ field: 'kind', message: 'The interview writes this kind, not the user.' })
  }
  if (problems.length > 0 || itemKind === undefined || fields === undefined || keyPrefix === null) {
    return { problems }
  }
  return {
    item: {
      kind: itemKind.kind,
      schemaVersion: itemKind.schema_version,
      keyPrefix,
      content: fields,
      parentItemId: parent?.id ?? null,
    },
  }
}

// Where the body of POST /items/{item_id}/move puts the item, or the problems of its fields. The
// parent is an item of the same artifact, and not the item or one inside it.
export function validateItemMove(
  item: ArtifactItem,
  body: Record<string, unknown>,
): { parentItemId: string | null; position: number } | { problems: FieldProblem[] } {
  const { parent_item_id: parentItemId = null, position } = body
  const parent = isString(parentItemId) ? findItem(parentItemId) : undefined
  const problems: FieldProblem[] = []
  if (
    parentItemId !== null &&
    (parent?.artifact_id !== item.artifact_id ||
      parent.id === item.id ||
      descendantsOf(item, allItems(), itemHierarchy).some(({ id }) => id === parent.id))
  ) {
    problems.push({
      field: 'parent_item_id',
      message: 'Choose an item of the artifact that is not inside this item.',
    })
  }
  const newPosition = positiveInteger(position)
  if (newPosition === undefined) problems.push(positiveIntegerProblem('position'))
  if (problems.length > 0 || newPosition === undefined) return { problems }
  return { parentItemId: parent?.id ?? null, position: newPosition }
}

// The children of a parent in the order the body of POST /artifacts/{artifact_id}/items/reorder
// gives, or the problem when it does not name each child once.
export function validateItemReorder(
  artifact: Artifact,
  body: Record<string, unknown>,
): { ordered: ArtifactItem[] } | { problems: FieldProblem[] } {
  const { parent_item_id: parentItemId = null, ids } = body
  const children = childrenOf(artifact.id, isString(parentItemId) ? parentItemId : null)
  const wanted: unknown[] = Array.isArray(ids) ? ids : []
  const ordered = wanted.flatMap((id) => children.filter((child) => child.id === id))
  if (ordered.length !== children.length || new Set(wanted).size !== children.length) {
    return { problems: [{ field: 'ids', message: 'Name each item under the parent once.' }] }
  }
  return { ordered }
}

// The fields of the body of PATCH /artifacts/{artifact_id} that the artifact takes, or the problems
// of the fields given wrong. A content is merged into the one the artifact has.
export function validateArtifactChange(
  body: Record<string, unknown>,
): { change: ArtifactChangeSet } | { problems: FieldProblem[] } {
  const { title, summary, content, review_status: reviewStatus } = body
  const problems = changeProblems(content, reviewStatus)
  const newContent = jsonObject(content)
  const newReviewStatus = choice(reviewStatuses, reviewStatus)
  const newTitle = requiredText(title)
  if (isSentButInvalid(title, requiredText)) {
    problems.push({ field: 'title', message: 'Enter a title.' })
  }
  if (optionalText(summary) === undefined) problems.push(optionalTextProblem('summary'))
  if (problems.length > 0) return { problems }
  return {
    change: {
      ...(newTitle !== undefined && { title: newTitle }),
      ...((isString(summary) || summary === null) && { summary }),
      ...(newContent !== undefined && { content: newContent }),
      ...(newReviewStatus !== undefined && { review_status: newReviewStatus }),
    },
  }
}

// The fields of the body of PATCH /items/{item_id} that the item takes, or the problems of the
// fields given wrong. A content is merged into the one the item has, and the whole is checked
// against the schema of the kind.
export function validateItemChange(
  item: ArtifactItem,
  body: Record<string, unknown>,
): { change: ItemChangeSet } | { problems: FieldProblem[] } {
  const { content, review_status: reviewStatus } = body
  const merged = { ...item.content, ...jsonObject(content) }
  const schema = findKind(item.kind)?.schema
  const problems = [
    ...changeProblems(content, reviewStatus),
    ...(schema === undefined ? [] : contentProblems(schema, merged, item.project_id)),
  ]
  if (problems.length > 0) return { problems }
  const newReviewStatus = choice(reviewStatuses, reviewStatus)
  return {
    change: {
      content: merged,
      ...(newReviewStatus !== undefined && { review_status: newReviewStatus }),
    },
  }
}
