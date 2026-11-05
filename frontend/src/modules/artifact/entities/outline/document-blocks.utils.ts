import {
  type ArtifactDisplay,
  type ItemDisplay,
  itemTitle,
} from '@/modules/workflow/entities/@x/artifact'
import { isOneOf } from '@/shared/lib/guards'

import type { OutlineItem } from '../items/items.types'
import type { ArrangedPlace, ArrangeInput, DocumentBlock } from './outline.types'
import { arrangeItems } from './outline.utils'

// Whether a layout of an artifact heads each group of items with its kind.
const groupHeadings = {
  document: true,
  transcript: false,
} as const satisfies Record<ArtifactDisplay, boolean>

// The displays whose items form a run on the page: every display of an item kind but the
// sections, which hold the structure of a document.
const runItemDisplays = [
  'table',
  'cards',
  'transcript',
  'profile',
] as const satisfies readonly Exclude<ItemDisplay, 'heading'>[]

// Which displays of a run of items draw the messages of a transcript, whose quoted words are marked.
const messageDisplays = {
  table: false,
  cards: false,
  transcript: true,
  profile: false,
} as const satisfies Record<Exclude<ItemDisplay, 'heading'>, boolean>

function headingLevel(item: OutlineItem): 2 | 3 | 4 | 5 {
  return Math.min(Math.max(item.depth + 1, 2), 5) as 2 | 3 | 4 | 5
}

function placeBlocks(
  place: ArrangedPlace,
  input: ArrangeInput,
  isTop: boolean,
  artifactDisplay: ArtifactDisplay,
): DocumentBlock[] {
  const sections = place.sections.flatMap(({ item, place: inner }): DocumentBlock[] => [
    {
      type: 'heading',
      item,
      title: itemTitle(input.kinds.get(item.kind)?.schema, item),
      level: headingLevel(item),
    },
    ...placeBlocks(inner, input, false, artifactDisplay),
  ])
  const runs = place.runs.flatMap(({ kind, items }): DocumentBlock[] => {
    const view = input.kinds.get(kind)
    if (view === undefined || !isOneOf(runItemDisplays, view.display)) return []
    const block: DocumentBlock = { type: 'items', kind, display: view.display, items }
    return isTop && place.sections.length === 0 && groupHeadings[artifactDisplay]
      ? [{ type: 'group', kind, title: view.title, count: items.length }, block]
      : [block]
  })
  return [...sections, ...runs]
}

/**
 * The parts of the page of a document, in the order of its outline: a heading for each section (its
 * depth gives `h2` to `h5`), a heading with the count for each run of items at the top of a document
 * without sections, and one block for each run of items of one kind, drawn by the display of the kind.
 * A `transcript` reads as one conversation: its runs have no heading of their kind.
 *
 * Every item is drawn with the current schema of its kind. An item written with an older schema is
 * drawn with its own schema on its item page; a field that the current schema lacks does not show in
 * the table of the document.
 */
export function documentBlocks(
  input: ArrangeInput,
  { artifactDisplay }: { artifactDisplay: ArtifactDisplay },
): DocumentBlock[] {
  return placeBlocks(arrangeItems(input), input, true, artifactDisplay)
}

/** Whether the blocks of a document draw messages of a transcript. */
export function hasTranscript(blocks: readonly DocumentBlock[]): boolean {
  return blocks.some((block) => block.type === 'items' && messageDisplays[block.display])
}
