import type { ActivityEntry } from '@/modules/activity/entities'

import type { PhaseBlock } from './phase-blocks.types'

/**
 * Gathers the entries of the chat of a run into blocks: each separator of a phase takes the items
 * that follow it, up to the next entry that is not one of its items, such as a message. Items that
 * come after such an entry form a block of their own, without a separator.
 */
export function phaseBlocks(entries: readonly ActivityEntry[]): PhaseBlock[] {
  const blocks: PhaseBlock[] = []
  for (const entry of entries) {
    if (entry.type === 'phase') {
      blocks.push({ type: 'phase', phaseId: entry.id, header: entry, items: [] })
    } else if ('phaseId' in entry) {
      const last = blocks.at(-1)
      if (last?.type === 'phase' && last.phaseId === entry.phaseId) last.items.push(entry)
      else blocks.push({ type: 'phase', phaseId: entry.phaseId, header: null, items: [entry] })
    } else {
      blocks.push({ type: 'entry', entry })
    }
  }
  return blocks
}
