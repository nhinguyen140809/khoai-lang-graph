import type { Artifact, ArtifactItem, ReviewStatus, Revision } from '@/modules/artifact/entities'
import type { ContentValues } from '@/modules/workflow/entities'

/** An item in the outline of its artifact, with the number that its place gives it. */
export interface PlacedItem {
  item: ArtifactItem
  /** 1 at the top level. */
  depth: number
}

/** The fields of an artifact that a change sets. */
export type ArtifactChangeSet = Partial<
  Pick<ArtifactOverride, 'title' | 'summary' | 'content' | 'review_status'>
>

/** The fields of an item that a change sets. */
export type ItemChangeSet = Partial<
  Pick<ItemOverride, 'content' | 'review_status' | 'parent_item_id' | 'position' | 'deleted'>
>

/** What it takes to add an item. */
export interface NewItemRecord {
  kind: string
  schemaVersion: number
  /** The prefix of the key of the kind, such as `REQ`. */
  keyPrefix: string
  content: ContentValues
  parentItemId: string | null
}

/** An item as the user left it, whole: the fields that a change can set. */
export interface ItemOverride {
  version: number
  content: ContentValues
  review_status: ReviewStatus
  parent_item_id: string | null
  position: number
  deleted: boolean
  updated_at: string
  /** The versions that the user made, newest first. */
  history: Revision[]
}

/** An artifact as the user left it, whole: the fields that a change can set. */
export interface ArtifactOverride {
  version: number
  title: string
  summary: string | null
  content: ContentValues
  review_status: ReviewStatus
  updated_at: string
  /** The versions that the user made, newest first. */
  history: Revision[]
  /** The version of each item, by item id, when the artifact reached a version that the user made. */
  itemVersionsAt: Record<number, Record<string, number>>
}

export interface ItemSpec {
  key: string
  kind: string
  content: ContentValues
  status?: ReviewStatus
  /** The version of the item; it starts at 1. */
  version?: number
  /** Items inside it: the contents of a section, or the stories of an epic. */
  children?: ItemSpec[]
}

export interface ArtifactSpec {
  kind: string
  title: string
  summary: string | null
  content: ContentValues
  items: ItemSpec[]
  status?: ReviewStatus
  version?: number
  /** For an interview: the key of the persona that is interviewed. */
  subjectKey?: string
}

/** The artifacts of a project and their items, in outline order. */
export interface BuiltProject {
  artifacts: Artifact[]
  items: ArtifactItem[]
}
