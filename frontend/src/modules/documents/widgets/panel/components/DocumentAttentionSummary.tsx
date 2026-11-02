'use client'

import {
  type attentionCounts,
  attentionLevels,
  attentionText,
  type OutlineItem,
} from '@/modules/artifact/entities'
import { ColoredText } from '@/shared/components/ui/colored-text'

interface DocumentAttentionSummaryProps {
  /** The states that ask something of the user, from `attentionCounts`. */
  counts: ReturnType<typeof attentionCounts>
  /** Opens the first item of a state, in the order of the outline. */
  onOpenItem: (item: OutlineItem) => void
}

/**
 * What asks something of the user in the open document, one entry for each state, in the color of
 * its level: the items to review before approving, the issues to resolve, the items the user edited.
 */
export function DocumentAttentionSummary({ counts, onOpenItem }: DocumentAttentionSummaryProps) {
  return (
    <>
      {counts.map(({ status, level, count, first }) => {
        const { color } = attentionLevels[level]
        return (
          <button
            key={status}
            type="button"
            className="rounded-sm px-1 py-0.5 whitespace-nowrap hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            onClick={() => {
              onOpenItem(first)
            }}
          >
            <ColoredText color={color}>{attentionText(status, count)}</ColoredText>
          </button>
        )
      })}
    </>
  )
}
