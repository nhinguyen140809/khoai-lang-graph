import type { RunStatus } from '@/modules/run/entities'
import { pluralForm } from '@/shared/lib/text'

/** The statuses of a run that show a status line at the end of its entries: the run is going on or about to. */
export const runStatusLineStatuses: readonly RunStatus[] = ['queued', 'running']

/** The words of the chat of the activity of a project. */
export const activityChatMessages = {
  tabTitle: 'Activity',
  loading: 'Loading the activity',
  loadError: 'The activity could not be loaded.',
  emptyTitle: 'No activity yet',
  emptyDescription: 'Send your idea or a request to start the work.',
  runLoading: 'Loading the work',
  runError: 'The work of this run could not be loaded.',
  entryError: 'This entry could not be shown.',
  run: (number: number) => `Run ${String(number)}`,
  answered: 'Answered:',
  answeredWithDefault: 'Answered with the default:',
  stopped: 'Stopped with the run',
  version: (version: number) => `version ${String(version)}`,
  itemMeta: (kind: string, key: string, version: number) =>
    `${kind} - ${key}, version ${String(version)}`,
  quickLook: (key: string) => `Quick look at ${key}`,
  toReview: 'To review:',
  moreReferences: (count: number) =>
    `${String(count)} more ${pluralForm(count, { one: 'item', other: 'items' })}`,
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
