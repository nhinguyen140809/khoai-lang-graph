import { pluralForm } from '@/shared/lib/text'

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
