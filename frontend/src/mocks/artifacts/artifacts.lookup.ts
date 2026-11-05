import {
  type Artifact,
  type ArtifactItem,
  type Origin,
  type OutlineItem,
  type Revision,
} from '@/modules/artifact/entities'
import type { ContentValues } from '@/modules/workflow/entities'
import { collectBy } from '@/shared/lib/collections'

import { isoTime } from '../shared/db'
import { placeInOutline } from './artifact-outline.utils'
import { artifactOverrides, createdItems, itemOverrides } from './artifacts.store'
import type { PlacedItem } from './artifacts.types'
import {
  artifactFixtures,
  itemFixtures,
  mentorArtifactBefore,
  mentorEditedBefore,
} from './fixtures/artifacts.fixtures'
import { userOrigin } from './origins.utils'

// The artifacts and the items as the mock server holds them now: the fixtures, the items that the
// user made, and what the user changed in both.

function withEdit(item: ArtifactItem): ArtifactItem {
  const override = itemOverrides.get()[item.id]
  if (override === undefined) return item
  return {
    ...item,
    version: override.version,
    content: override.content,
    review_status: override.review_status,
    parent_item_id: override.parent_item_id,
    position: override.position,
    updated_by: userOrigin,
    updated_at: override.updated_at,
  }
}

// The items of the fixtures and the items made since, deleted ones too.
export function itemsWithDeleted(): ArtifactItem[] {
  return [...itemFixtures, ...createdItems.get()].map(withEdit)
}

function isDeleted(itemId: string): boolean {
  return itemOverrides.get()[itemId]?.deleted === true
}

// The placed items for the records they were made from: every change sets a new record, so a
// request that reads the items several times places them once.
// The one cell outside the store: it holds nothing the app can change, only the result of placing
// the records it was made from.
let placedCache: { created: unknown; overrides: unknown; placed: PlacedItem[] } | null = null

// The items of every artifact in outline order, each with the number and the depth of its place.
function placedItems(): PlacedItem[] {
  const created = createdItems.get()
  const overrides = itemOverrides.get()
  if (placedCache?.created === created && placedCache.overrides === overrides)
    return placedCache.placed
  const placed = placeAllItems()
  placedCache = { created, overrides, placed }
  return placed
}

function placeAllItems(): PlacedItem[] {
  const ofArtifact = collectBy(
    itemsWithDeleted().filter(({ id }) => !isDeleted(id)),
    ({ artifact_id }) => artifact_id,
  )
  return [...ofArtifact.values()].flatMap((items) => placeInOutline(items))
}

/** Every item that is not deleted. */
export function allItems(): ArtifactItem[] {
  return placedItems().map(({ item }) => item)
}

/** The items under a parent of an artifact, or its top level when the parent is null, by position. */
export function childrenOf(artifactId: string, parentItemId: string | null): ArtifactItem[] {
  return allItems()
    .filter((item) => item.artifact_id === artifactId && item.parent_item_id === parentItemId)
    .toSorted((a, b) => a.position - b.position)
}

/** An item that is not deleted. */
export function findItem(itemId: string): ArtifactItem | undefined {
  return allItems().find(({ id }) => id === itemId)
}

/**
 * An item, also one that was deleted. A deleted item has the number its place would have among
 * the items of its artifact, deleted ones included.
 */
export function findItemWithDeleted(itemId: string): ArtifactItem | undefined {
  const live = findItem(itemId)
  if (live !== undefined) return live
  const deleted = itemsWithDeleted().find(({ id }) => id === itemId)
  if (deleted === undefined) return undefined
  const siblings = itemsWithDeleted().filter(
    ({ artifact_id }) => artifact_id === deleted.artifact_id,
  )
  return placeInOutline(siblings).find(({ item }) => item.id === itemId)?.item
}

/** The items of one artifact in outline order, each with its depth. */
export function outlineOfArtifact(artifactId: string): OutlineItem[] {
  return placedItems()
    .filter(({ item }) => item.artifact_id === artifactId)
    .map(({ item, depth }) => ({ ...item, depth }))
}

function withArtifactOverride(artifact: Artifact): Artifact {
  const override = artifactOverrides.get()[artifact.id]
  if (override === undefined) return artifact
  return {
    ...artifact,
    version: override.version,
    title: override.title,
    summary: override.summary,
    content: override.content,
    review_status: override.review_status,
    updated_by: userOrigin,
    updated_at: override.updated_at,
  }
}

/** Every artifact with what the user changed in it and the count of its items now. */
export function allArtifacts(): Artifact[] {
  const items = allItems()
  return artifactFixtures.map((artifact) => ({
    ...withArtifactOverride(artifact),
    item_count: items.filter(({ artifact_id }) => artifact_id === artifact.id).length,
  }))
}

export function findArtifact(artifactId: string): Artifact | undefined {
  return allArtifacts().find(({ id }) => id === artifactId)
}

// The versions of a record of the fixtures, newest first: the first was generated by its creator,
// the last was made by whoever updated the record, and the ones between were the user's edits or
// the agents' reworks. Each version before the last holds the content the fixtures give for it,
// or the current one when they give none, so a history shows real changes.
function fixtureRevisions(
  base: {
    version: number
    created_by: Origin
    created_at: string
    updated_by: Origin
    updated_at: string
    content: ContentValues
  },
  before: readonly ContentValues[] = [],
) {
  return Array.from({ length: base.version }, (_, index): Revision => {
    const version = base.version - index
    const isLatest = version === base.version && version > 1
    const historicalTime = isoTime(new Date(new Date(base.created_at).getTime() + version * 1000))
    return {
      version,
      // The first version is what the agents generated; the ones after it are the edits of the
      // user when the record is hers now, else the reworks of the agents.
      change_reason:
        version === 1 ? 'generated' : base.updated_by.actor === 'user' ? 'user_edit' : 'rework',
      // The author of the first version is the one that made the record; the user made the
      // versions between it and the last one.
      changed_by: version === 1 ? base.created_by : isLatest ? base.updated_by : userOrigin,
      created_at: isLatest ? base.updated_at : historicalTime,
      content: version === base.version ? base.content : (before[version - 1] ?? base.content),
    }
  })
}

/** The versions of an item, newest first: what the user made, then those of the fixtures. */
export function itemRevisions(item: ArtifactItem): Revision[] {
  const base = itemFixtures.find(({ id }) => id === item.id)
  return [
    ...(itemOverrides.get()[item.id]?.history ?? []),
    ...(base === undefined ? [] : fixtureRevisions(base, mentorEditedBefore[base.key])),
  ]
}

/** The versions of an artifact, newest first: what the user made, then those of the fixtures. */
export function artifactRevisions(artifact: Artifact): Revision[] {
  const base = artifactFixtures.find(({ id }) => id === artifact.id)
  return [
    ...(artifactOverrides.get()[artifact.id]?.history ?? []),
    ...(base === undefined ? [] : fixtureRevisions(base, mentorArtifactBefore[base.title])),
  ]
}

/**
 * The revision of an item that restoring an artifact to a version brings back, or undefined when
 * the item did not exist then. The versions that the user made remember the version of each item;
 * a version of the fixtures is older than any override, so its items have the content of the fixtures.
 */
export function itemRevisionAtArtifactVersion(
  item: ArtifactItem,
  artifactId: string,
  artifactVersion: number,
): Revision | undefined {
  const remembered = artifactOverrides.get()[artifactId]?.itemVersionsAt[artifactVersion]
  const wanted =
    remembered === undefined
      ? itemFixtures.find(({ id }) => id === item.id)?.version
      : remembered[item.id]
  return itemRevisions(item).find((entry) => entry.version === wanted)
}

/**
 * A record as a request reads it: as it is now when no version is named, else the record with the
 * content, the author and the time of that version. Undefined when the record never had that
 * version.
 */
export function atVersion<
  T extends {
    version: number
    content: ContentValues
    updated_by: Origin
    updated_at: string
  },
>(record: T, revisions: Revision[], version: number | null): T | undefined {
  if (version === null || version === record.version) return record
  const revision = revisions.find((entry) => entry.version === version)
  if (revision === undefined) return undefined
  return {
    ...record,
    version: revision.version,
    content: revision.content,
    updated_by: revision.changed_by,
    updated_at: revision.created_at,
  }
}

/**
 * An item as a request reads it: with the number of its place now, also at a named version.
 * Undefined when the item never had that version.
 */
export function itemAtVersion<T extends ArtifactItem>(
  item: T,
  version: number | null,
): T | undefined {
  return atVersion(item, itemRevisions(item), version)
}
