'use client'

import { formatCurrency } from '@/shared/lib/numbers'
import { formatDuration } from '@/shared/lib/time'
import { useView, type View, type Wording } from '@/shared/lib/view'

import { runErrorLabel } from '../../runs/run-error.utils'
import type { Run } from '../../runs/runs.types'
import { durationWords } from '../duration-words.utils'
import { workMessages, workStatusLabels } from '../work.constants'
import type { WorkEntry, WorkWords } from '../work.types'
import { workStatusLooks } from '../work-status-look.constants'

/** One way of reading a part of a line of work, in each view. */
type WorkWord<Args extends readonly unknown[], Result> = Record<View, (...args: Args) => Result>

/** The words of each part of a line of work, in the view of the app. */
interface WorkWordsTable {
  round: WorkWord<[iteration: number], string>
  took: WorkWord<[durationMs: number], string>
  writes: WorkWord<[created: number, changed: number], string>
  details: WorkWord<[entry: WorkEntry], string[]>
  failure: WorkWord<[entry: WorkEntry, errorLabel: Wording | null], string | null>
}

/** The words of a line of work, each part read in the view that the caller names. */
const workWords = {
  round: {
    user: (iteration) => workMessages.round(iteration + 1),
    developer: (iteration) => workMessages.iteration(iteration),
  },
  took: {
    user: (durationMs) => durationWords(durationMs),
    developer: (durationMs) => formatDuration(durationMs),
  },
  writes: {
    user: (created, changed) => workMessages.writes(created, changed),
    developer: (created, changed) => workMessages.counts(created, changed),
  },
  details: {
    user: () => [],
    // A line that a message cut short holds no step: its steps, model and cost are on its last part.
    developer: (entry) =>
      entry.steps.length === 0
        ? []
        : [
            workMessages.steps(entry.steps.length),
            entry.modelId,
            formatCurrency(entry.costUsd),
          ].filter((detail) => detail !== null),
  },
  failure: {
    user: (_entry, errorLabel) => errorLabel?.user ?? workMessages.failedWithoutReason,
    developer: (entry) => entry.error,
  },
} as const satisfies WorkWordsTable

/**
 * The words of a line of work in the view of the app, from `workMessages` and the labels of its
 * status and of the error of the run; null for a part the view does not show.
 */
export function useWorkWords(entry: WorkEntry, run: Pick<Run, 'error'> | null): WorkWords {
  const view = useView()
  const look = workStatusLooks[entry.status]
  const errorLabel = run === null ? null : runErrorLabel(run.error?.code ?? '')

  return {
    status: look.isCompleted ? null : workStatusLabels[entry.status][view],
    continued: entry.continues ? workMessages.continued : null,
    round: entry.iteration > 0 ? workWords.round[view](entry.iteration) : null,
    took:
      entry.durationMs !== null && (look.isCompleted || look.isFailed)
        ? workWords.took[view](entry.durationMs)
        : null,
    writes:
      entry.created.length > 0 || entry.changed.length > 0
        ? workWords.writes[view](entry.created.length, entry.changed.length)
        : null,
    details: workWords.details[view](entry),
    failure: look.isFailed ? workWords.failure[view](entry, errorLabel) : null,
  }
}
