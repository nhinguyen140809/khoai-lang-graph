import { itemTitle } from '@/modules/workflow/entities/@x/artifact'

import type { OutlineItem } from '../items/items.types'
import type { ArrangedPlace, ArrangeInput, DocumentBlock } from './outline.types'
import { arrangeItems } from './outline.utils'

function headingLevel(item: OutlineItem): 2 | 3 | 4 | 5 {
  return Math.min(Math.max(item.depth + 1, 2), 5) as 2 | 3 | 4 | 5
}

function placeBlocks(place: ArrangedPlace, input: ArrangeInput, isTop: boolean): DocumentBlock[] {
  const sections = place.sections.flatMap(({ item, place: inner }): DocumentBlock[] => [
    {
      type: 'heading',
      item,
      title: itemTitle(input.kinds.get(item.kind)?.schema, item),
      level: headingLevel(item),
    },
    ...placeBlocks(inner, input, false),
  ])
  const runs = place.runs.flatMap(({ kind, items }): DocumentBlock[] => {
    const view = input.kinds.get(kind)
    if (view === undefined || view.display === 'document' || view.display === 'heading') return []
    const block: DocumentBlock = { type: 'items', kind, display: view.display, items }
    return isTop && place.sections.length === 0
      ? [{ type: 'group', kind, title: view.title, count: items.length }, block]
      : [block]
  })
  return [...sections, ...runs]
}

/**
 * The parts of the page of a document, in the order of its outline: a heading for each section (its
 * depth gives `h2` to `h5`), a heading with the count for each run of items at the top of a document
 * without sections, and one block for each run of items of one kind, drawn by the display of the kind.
 *
 * Every item is drawn with the current schema of its kind. An item written with an older schema is
 * drawn with its own schema on its item page; a field that the current schema lacks does not show in
 * the table of the document.
 */
export function documentBlocks(input: ArrangeInput): DocumentBlock[] {
  return placeBlocks(arrangeItems(input), input, true)
}

/** Whether the blocks of a document draw messages of a transcript. */
export function hasTranscript(blocks: readonly DocumentBlock[]): boolean {
  return blocks.some((block) => block.type === 'items' && block.display === 'transcript')
}
