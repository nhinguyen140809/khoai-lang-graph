import type { Run } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'

import type { ChatBlock } from './chat-blocks.types'

/** A run that has written no message yet has no place among the messages; it stands at the end. */
const AFTER_EVERYTHING = Number.POSITIVE_INFINITY

/**
 * The blocks of the chat in the order they were said: a run takes the place of its first message,
 * and a message that no run took in keeps its own place between the runs it came between — the word
 * of the user before a run takes it, and the answer of the assistant, which no run ever holds.
 */
export function chatBlocksOf(
  runs: readonly Run[],
  byRun: ReadonlyMap<string | null, readonly Message[]>,
): ChatBlock[] {
  const runBlocks: { order: number; block: ChatBlock }[] = runs.map((run) => ({
    order: byRun.get(run.id)?.[0]?.sequence ?? AFTER_EVERYTHING,
    block: { type: 'run', run },
  }))
  const loose: { order: number; block: ChatBlock }[] = (byRun.get(null) ?? []).map((message) => ({
    order: message.sequence,
    block: { type: 'message', message },
  }))
  return [...runBlocks, ...loose].toSorted((a, b) => a.order - b.order).map(({ block }) => block)
}
