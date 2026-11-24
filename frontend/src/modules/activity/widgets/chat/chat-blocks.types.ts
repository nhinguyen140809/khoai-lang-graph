import type { Run } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'

/** A block of the chat in the order it was said: a run with its entries, or a message no run took in. */
export type ChatBlock = { type: 'run'; run: Run } | { type: 'message'; message: Message }
