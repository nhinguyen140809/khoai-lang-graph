import {
  attentionLevels,
  branchAttention,
  type ItemStatus,
  itemStatusLook,
  type StatusCount,
} from '@/modules/artifact/entities'
import {
  type DocumentMark,
  documentMarkLook,
  documentsMessages,
} from '@/modules/documents/entities'
import type { View } from '@/shared/lib/view'

import type { RowLook } from './document-tree.types'

/** The look of a row that says nothing: the text color, no letter. */
export const plainLook: RowLook = { level: 'none', color: null, letter: null, text: null }

/** The look of the row that stands in for an outline that loads or failed to load. */
export const messageLook: RowLook = { ...plainLook, level: 'quiet' }

/** The look of a document or a group by its mark; `version` is added to a mark with no letter. */
export function markRowLook(mark: DocumentMark, version: number | null): RowLook {
  const look = documentMarkLook(mark)
  return {
    level: look.level,
    color: look.color,
    letter: look.letter,
    text:
      version !== null && look.letter === null
        ? documentsMessages.statusWithVersion(look.label, version)
        : look.label,
  }
}

/** The look of an item by its status, in a document that is, or is not, under review. */
export function itemRowLook(
  status: ItemStatus,
  version: number,
  options: { isUnderReview: boolean },
  view: View,
): RowLook {
  const look = itemStatusLook(status, options, view)
  return {
    level: look.level,
    color: look.color,
    letter: look.letter,
    text:
      look.level === 'none' ? documentsMessages.statusWithVersion(look.label, version) : look.label,
  }
}

/**
 * The looks of a section or a group: expanded, it shows what the rows under it ask in words, and
 * collapsed, it also takes the level of the one that asks most.
 */
export function branchRowLooks(
  counts: readonly StatusCount[],
  options: { isUnderReview: boolean },
): { expanded: RowLook; collapsed: RowLook } {
  const { level, text } = branchAttention(counts, options)
  const held = text === '' ? null : text
  return {
    expanded: { ...plainLook, text: held },
    collapsed: { level, color: attentionLevels[level].color, letter: null, text: held },
  }
}
