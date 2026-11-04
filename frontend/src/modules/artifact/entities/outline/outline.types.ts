import type { ReactNode } from 'react'

import type {
  ArtifactDisplay,
  ContentDisplay,
  ContentField,
  ContentSchema,
  ContentValues,
} from '@/modules/workflow/entities/@x/artifact'
import type { Tone } from '@/shared/lib/tone'

import type { Artifact } from '../artifacts/artifacts.types'
import type { OutlineItem } from '../items/items.types'
import type { ItemStatus, StatusCount } from '../status/item-status.types'

/** Draws the title of an item as a link to its page; the page of the document gives how it opens. */
export type RenderItemLink = (item: OutlineItem, title: ReactNode) => ReactNode

/** Wraps some content in one element that opens the page of the item with this id and takes a class, such as a `PageLink`. */
export type RenderItemIdLink = (itemId: string, children: ReactNode) => ReactNode

/** A row of the outline of an artifact. `id` is unique in the tree of one artifact. */
export type OutlineNode =
  | {
      type: 'section'
      id: string
      item: OutlineItem
      title: string
      count: number
      /** The statuses of the items under the row, which do not depend on the review. */
      statusCounts: StatusCount[]
      children: OutlineNode[]
    }
  | {
      type: 'group'
      id: string
      kind: string
      title: string
      count: number
      /** The statuses of the items under the row, which do not depend on the review. */
      statusCounts: StatusCount[]
      children: OutlineNode[]
    }
  | { type: 'item'; id: string; item: OutlineItem; title: string; status: ItemStatus }
  | { type: 'field'; id: string; name: string; title: string }

/** What a kind needs to be placed and drawn: its title, display and schema, by kind name. */
export interface KindView {
  title: string
  display: ContentDisplay
  schema: ContentSchema
}

/** One part of the page of a document. Each `items` block holds consecutive items of one kind. */
export type DocumentBlock =
  | { type: 'heading'; item: OutlineItem; title: string; level: 2 | 3 | 4 | 5 }
  | { type: 'group'; kind: string; title: string; count: number }
  | {
      type: 'items'
      kind: string
      display: Exclude<ContentDisplay, 'document' | 'heading'>
      items: OutlineItem[]
    }

/** What `useOutlineItems` gives. */
export type OutlineItemsResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | {
      state: 'success'
      items: OutlineItem[]
      itemKinds: string[]
      kinds: ReadonlyMap<string, KindView>
    }

/** What an artifact holds under one parent: its sections, then its items in runs of one kind. */
export interface ArrangedPlace {
  sections: { item: OutlineItem; place: ArrangedPlace }[]
  runs: { kind: string; items: OutlineItem[] }[]
}

export interface ArrangeInput {
  items: readonly OutlineItem[]
  itemKinds: readonly string[]
  kinds: ReadonlyMap<string, KindView>
}

/** What `useArtifactOutline` gives: the artifact, its outline and the status of each of its items. */
export type ArtifactOutlineResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | {
      state: 'success'
      artifact: Artifact
      /** Every item of the artifact in outline order, the sections included. */
      items: OutlineItem[]
      /** The kinds that draw the items, by kind name. */
      kinds: ReadonlyMap<string, KindView>
      nodes: OutlineNode[]
      statuses: { item: OutlineItem; status: ItemStatus }[]
    }

/** Where an item sits among the items that a reader goes through in a document. */
export interface OutlineNeighbors {
  /** The place of the item, from 1; 0 when the item is not in the outline. */
  index: number
  count: number
  previous: OutlineItem | null
  next: OutlineItem | null
}

/** A step of the path from a document down to an item: a section, or the group of the kind of the item. */
export interface BreadcrumbStep {
  id: string
  title: string
}

/** What the page of a document draws: the artifact, its filled fields and the parts of its page. */
export interface ArtifactDocumentData {
  artifact: Artifact
  /** How the document is laid out: the display of its artifact kind. */
  display: ArtifactDisplay
  /** The filled fields of the artifact, in the order of its schema. */
  fields: ContentField[]
  /** The people of its conversation; empty for a document that is not a transcript. */
  participants: Participant[]
  blocks: DocumentBlock[]
  /** The kinds that draw the items, by kind name. */
  kinds: ReadonlyMap<string, KindView>
}

/** A person of a conversation, as its transcript draws it. */
export interface Participant {
  key: string
  name: string
  /** The item that the participant is, whose page it reaches; null for an agent. */
  itemId: string | null
  /** `end` for those who share the role of the first participant, who leads; `start` for the others. */
  side: 'start' | 'end'
  tone: Tone
}

/** A part of a conversation: a separator where values change, or the messages in a row of one participant. */
export type TranscriptPart =
  | { type: 'separator'; key: string; fields: ContentField[]; content: ContentValues }
  | {
      type: 'run'
      key: string
      participant: Participant
      messages: { item: OutlineItem; text: string }[]
    }

/** What `useArtifactDocument` gives: the document, or why it is not there. */
export type ArtifactDocumentResult =
  | { state: 'pending' }
  | { state: 'notFound' }
  | { state: 'error'; retry: () => void }
  | ({ state: 'success' } & ArtifactDocumentData)
