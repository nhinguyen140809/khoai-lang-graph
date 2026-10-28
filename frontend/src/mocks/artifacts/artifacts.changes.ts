import {
  type Artifact,
  type ArtifactItem,
  type ChangeReason,
  reviewStatus,
  type Revision,
} from '@/modules/artifact/entities'
import type { ContentValues } from '@/modules/workflow/entities'

import { IdPrefix, mockId, mockNow } from '../shared/db'
import { allItems, childrenOf, findArtifact, itemsWithDeleted } from './artifacts.lookup'
import { artifactOverrides, createdItems, itemOverrides } from './artifacts.store'
import type { ArtifactChangeSet, ItemChangeSet, NewItemRecord } from './artifacts.types'
import { userOrigin } from './origins.utils'

// What the user does to the artifacts and the items in the mock server: each change gives a record
// a new version and keeps the versions before it.

// The ids of the items that the user made start here, above those of the fixtures: the projects of
// the fixtures number their items by thousands, so the base of `createdId` would reach them.
const CREATED_ITEM_BASE = 100_000

function revisionOf(
  version: number,
  reason: ChangeReason,
  content: ContentValues,
  createdAt: string,
): Revision {
  return { version, change_reason: reason, changed_by: userOrigin, created_at: createdAt, content }
}

// The version fields of an override, which an item and an artifact share: the new version, when it was
// made, and the revision of the change first in the versions of the record.
function nextVersion(
  version: number,
  reason: ChangeReason,
  content: ContentValues,
  history: Revision[],
) {
  const updatedAt = mockNow()
  return {
    version,
    updated_at: updatedAt,
    history: [revisionOf(version, reason, content, updatedAt), ...history],
  }
}

// The fields of an item that a change can set, as the item has them now.
function fieldsOf(item: ArtifactItem) {
  return {
    content: item.content,
    review_status: item.review_status,
    parent_item_id: item.parent_item_id,
    position: item.position,
    deleted: false,
  }
}

/** Gives an item a new version made by the user, with the fields of `change`. */
export function changeItem(item: ArtifactItem, change: ItemChangeSet, reason: ChangeReason) {
  const overrides = itemOverrides.get()
  const before = overrides[item.id]
  itemOverrides.set({
    ...overrides,
    [item.id]: {
      ...fieldsOf(item),
      ...change,
      ...nextVersion(
        item.version + 1,
        reason,
        change.content ?? item.content,
        before?.history ?? [],
      ),
    },
  })
}

/**
 * Gives the items the positions 1, 2, ... in the order given; each item that changes place gets a
 * new version.
 */
export function renumberChildren(ordered: ArtifactItem[]) {
  ordered.forEach((item, index) => {
    if (item.position !== index + 1) changeItem(item, { position: index + 1 }, 'user_edit')
  })
}

/**
 * Puts an item under a parent, or at the top level when it is null, at a position from 1; the
 * other children of the new parent keep their order around it.
 */
export function moveItem(item: ArtifactItem, parentItemId: string | null, position: number) {
  const siblings = childrenOf(item.artifact_id, parentItemId).filter(({ id }) => id !== item.id)
  const index = Math.min(position - 1, siblings.length)
  changeItem(item, { parent_item_id: parentItemId, position: index + 1 }, 'user_edit')
  siblings.forEach((sibling, order) => {
    const place = order < index ? order + 1 : order + 2
    if (sibling.position !== place) changeItem(sibling, { position: place }, 'user_edit')
  })
}

// The version of each item of an artifact, by item id, as the items are now.
function itemVersionsOf(artifactId: string): Record<string, number> {
  return Object.fromEntries(
    allItems()
      .filter(({ artifact_id }) => artifact_id === artifactId)
      .map(({ id, version }) => [id, version]),
  )
}

/**
 * Gives an artifact a new version made by the user, with the fields of `change`. The new version
 * remembers the version of each item, so that restoring it can bring the items back.
 */
export function changeArtifact(
  artifact: Artifact,
  change: ArtifactChangeSet,
  reason: ChangeReason,
) {
  const overrides = artifactOverrides.get()
  artifactOverrides.set({
    ...overrides,
    [artifact.id]: {
      title: artifact.title,
      summary: artifact.summary,
      content: artifact.content,
      review_status: artifact.review_status,
      ...change,
      ...nextVersion(
        artifact.version + 1,
        reason,
        change.content ?? artifact.content,
        overrides[artifact.id]?.history ?? [],
      ),
      itemVersionsAt: {
        ...overrides[artifact.id]?.itemVersionsAt,
        [artifact.version + 1]: itemVersionsOf(artifact.id),
      },
    },
  })
}

/**
 * Gives the artifact of an item a new version, as the API does when its items are added, removed,
 * reordered or changed. A request that changes several items calls it once.
 */
export function recordArtifactChange(artifactId: string, reason: ChangeReason) {
  const artifact = findArtifact(artifactId)
  if (artifact !== undefined) changeArtifact(artifact, {}, reason)
}

/** Adds an item made by the user, last under its parent, with the next key of its kind. */
export function addItem(artifact: Artifact, record: NewItemRecord): ArtifactItem {
  const created = createdItems.get()
  const keyPattern = new RegExp(`^${record.keyPrefix}-(\\d+)$`)
  const lastNumber = Math.max(
    0,
    ...itemsWithDeleted()
      .filter(({ project_id }) => project_id === artifact.project_id)
      .map(({ key }) => Number(keyPattern.exec(key)?.[1] ?? 0)),
  )
  const siblings = allItems().filter(
    ({ artifact_id, parent_item_id }) =>
      artifact_id === artifact.id && parent_item_id === record.parentItemId,
  )
  const createdAt = mockNow()
  const item: ArtifactItem = {
    id: mockId(IdPrefix.Item, CREATED_ITEM_BASE + created.length + 1),
    artifact_id: artifact.id,
    project_id: artifact.project_id,
    key: `${record.keyPrefix}-${String(lastNumber + 1).padStart(3, '0')}`,
    kind: record.kind,
    parent_item_id: record.parentItemId,
    position: Math.max(0, ...siblings.map(({ position }) => position)) + 1,
    // The number comes with the place in the outline, which every read gives it.
    outline_number: '',
    schema_version: record.schemaVersion,
    version: 1,
    review_status: reviewStatus.draft,
    created_by: userOrigin,
    updated_by: userOrigin,
    created_at: createdAt,
    updated_at: createdAt,
    content: record.content,
  }
  createdItems.set([...created, item])
  itemOverrides.set({
    ...itemOverrides.get(),
    [item.id]: {
      ...fieldsOf(item),
      version: 1,
      updated_at: createdAt,
      history: [revisionOf(1, 'user_edit', item.content, createdAt)],
    },
  })
  return item
}
