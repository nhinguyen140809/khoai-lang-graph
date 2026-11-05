import {
  type Artifact,
  type ArtifactItem,
  type UpdateArtifactBody,
  type UpdateItemBody,
} from '@/modules/artifact/entities'
import {
  changedFields,
  type ContentField,
  type ContentValues,
  initialValue,
  toStoredContent,
  withoutEmptyEntries,
} from '@/modules/workflow/entities'
import { ApiError, ApiErrorCode } from '@/shared/api/error'

// What a save of the edit forms sends: only the fields that changed, stored as the API stores
// them, with the empty entries dropped; and the answer that says the record moved on.

/** The content the form starts from: the content of the record, with a value for each field it lacks. */
export function initialContent(
  fields: readonly ContentField[],
  content: ContentValues,
): ContentValues {
  const initial = { ...content }
  for (const field of fields) {
    if (!(field.name in initial)) initial[field.name] = initialValue(field)
  }
  return initial
}

/** What a save of the item form sends: the content fields that changed, stored, without the empty entries. */
export function itemUpdateBody(
  fields: readonly ContentField[],
  item: Pick<ArtifactItem, 'content'>,
  values: { content: ContentValues },
): UpdateItemBody {
  const changed = changedFields(fields, item.content, values.content)
  const content = withoutEmptyEntries(
    fields,
    Object.fromEntries(changed.map((name) => [name, values.content[name]])),
  )
  const stored = toStoredContent(
    fields.filter((field) => changed.includes(field.name)),
    content,
  )
  return Object.keys(stored).length === 0 ? {} : { content: stored }
}

/** What a save of the artifact form sends: the content fields that changed, and the title and summary when they did. */
export function artifactUpdateBody(
  fields: readonly ContentField[],
  artifact: Pick<Artifact, 'title' | 'summary' | 'content'>,
  values: { title: string; summary: string; content: ContentValues },
): UpdateArtifactBody {
  const body: UpdateArtifactBody = itemUpdateBody(fields, artifact, values)
  if (values.title !== artifact.title) body.title = values.title
  if (values.summary !== (artifact.summary ?? ''))
    body.summary = values.summary === '' ? null : values.summary
  return body
}

/** Whether an error of a save says the record changed since the form opened. */
export function isVersionConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === ApiErrorCode.VersionConflict
}
