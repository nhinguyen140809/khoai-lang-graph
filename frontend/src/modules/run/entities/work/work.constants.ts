import { joinPresent, pluralForm } from '@/shared/lib/text'
import type { Wording } from '@/shared/lib/view'

import type { WorkStatus } from './work.types'

/** The label of each status of a line of work in each view, as the chat and Progress read it. */
export const workStatusLabels = {
  running: { developer: 'Running', user: 'Working' },
  waiting: { developer: 'Waiting for review', user: 'Waiting for your review' },
  stopped: { developer: 'Cancelled', user: 'Stopped' },
  done: { developer: 'Done', user: 'Done' },
  failed: { developer: 'Failed', user: 'Failed' },
} as const satisfies Record<WorkStatus, Wording>

/** The words of a line of work: what it is about, its round, how long it took, what it wrote. */
export const workMessages = {
  titleWithSubject: (stage: string, subject: string) => `${stage}: ${subject}`,
  round: (round: number) => `Round ${String(round)}`,
  /** The developer view of the round. */
  iteration: (iteration: number) => `iteration ${String(iteration)}`,
  took: {
    lessThanAMinute: 'Took less than a minute',
    minutes: (minutes: number) =>
      `Took ${String(minutes)} ${pluralForm(minutes, { one: 'minute', other: 'minutes' })}`,
    hours: (hours: number, minutes: number) =>
      joinPresent(
        [
          `Took ${String(hours)} ${pluralForm(hours, { one: 'hour', other: 'hours' })}`,
          minutes === 0
            ? null
            : `${String(minutes)} ${pluralForm(minutes, { one: 'minute', other: 'minutes' })}`,
        ],
        ' ',
      ),
  },
  /** What the work wrote, in the user view; a count of zero is left out. */
  writes: (written: number, updated: number) =>
    joinPresent([
      written > 0 ? `${String(written)} written` : null,
      updated > 0 ? `${String(updated)} updated` : null,
    ]),
  /** What the work wrote of one kind of item, in the user view. */
  kindWrites: (kind: string, written: number, updated: number) =>
    `${kind}: ${workMessages.writes(written, updated)}`,
  /** The developer view of what it wrote. */
  counts: (created: number, changed: number) => `+${String(created)} ~${String(changed)}`,
  steps: (count: number) =>
    `${String(count)} ${pluralForm(count, { one: 'step', other: 'steps' })}`,
  /** The line for the uses in a row of a tool that the definition does not list. */
  unknownToolUses: (tool: string, count: number) =>
    `Used ${tool} ${String(count)} ${pluralForm(count, { one: 'time', other: 'times' })}`,
  /** On a line of work that carries on after a message cut the line before it short. */
  continued: 'Continued',
  failedWithoutReason: 'The work stopped because of an error.',
} as const
