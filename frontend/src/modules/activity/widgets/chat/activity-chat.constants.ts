import type { RunStatus } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'
import type { Slot } from '@/shared/components/act'
import { pluralForm } from '@/shared/lib/text'

/** The statuses of a run that show a status line at the end of its entries: the run is going on or about to. */
export const runStatusLineStatuses: readonly RunStatus[] = ['queued', 'running']

/** The words of the chat of the activity of a project. */
export const activityChatMessages = {
  loading: 'Loading the activity',
  loadError: 'The activity could not be loaded.',
  emptyTitle: 'No activity yet',
  emptyDescription: 'Send your idea or a request to start the work.',
  runLoading: 'Loading the work',
  olderLoading: 'Loading the earlier work',
  olderError: 'The earlier work could not be loaded.',
  runError: 'The work of this run could not be loaded.',
  entryError: 'This entry could not be shown.',
  answered: 'Answered:',
  answeredWithDefault: 'Answered with the default:',
  stopped: 'Stopped with the run',
  version: (version: number) => `version ${String(version)}`,
  itemMeta: (kind: string, key: string, version: number) =>
    `${kind} - ${key}, version ${String(version)}`,
  quickLook: (key: string) => `Quick look at ${key}`,
  /** A sentence around the documents that a review asks to read, so that it is not a label with a colon. */
  readBeforeAnswering: { start: 'Please read', end: 'before you answer.' },
  moreReferences: (count: number) =>
    `${String(count)} more ${pluralForm(count, { one: 'item', other: 'items' })}`,
  /** Names the bar of the stages under the prompt, for assistive technology. */
  progress: 'Progress',
  showDetails: 'Show what it noted and wrote',
  prompt: {
    label: 'Message to the agents',
    placeholder: 'Ask or request a change',
    send: 'Send',
    keys: 'Enter to send, Shift+Enter for a new line',
  },
} as const

/**
 * How long the chat waits, after a long message arrives, before it moves the start of the message
 * into view: the scroller has first followed the end of the chat, and a move that comes within
 * that time is taken for part of it, so the scroller would follow the end again at the next line.
 */
export const revealDelayMs = 250

/** The messages of a run without any; one list, so that its entries do not compute again. */
export const emptyMessages: Message[] = []

/** The slots around the agent on the corner of a review that waits that its act may use: those above and beside it, not those over the card. */
export const pendingActSlots: readonly Slot[] = ['top', 'top-right', 'right']

/** The slots around the agent at work at the end of the chat that its act may use: not the side that the chat column ends at. */
export const statusLineSlots: readonly Slot[] = [
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'center',
]
