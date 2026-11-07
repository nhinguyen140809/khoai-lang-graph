'use client'

import { formatCurrency } from '@/shared/lib/numbers'
import { formatDuration } from '@/shared/lib/time'
import { useView, type View, type Wording } from '@/shared/lib/view'

import { runErrorLabel } from '../../runs/run-error.utils'
import type { Run } from '../../runs/runs.types'
import { durationWords } from '../duration-words.utils'
import type { WorkEntry, WorkWords } from '../run-steps.types'
import { workStatusLooks } from '../stage-status-look.constants'
import { workMessages, workStatusLabels } from '../work.constants'

/** The words of each part of a line of work in one view. */
interface WorkWordsOfView {
  round: (iteration: number) => string
  took: (durationMs: number) => string
  writes: (created: number, changed: number) => string
  details: (entry: WorkEntry) => string[]
  failure: (entry: WorkEntry, errorLabel: Wording | null) => string | null
}

/** The words of a line of work in each view, looked up by the view rather than branched on it. */
const workWordsByView = {
  user: {
    round: (iteration) => workMessages.round(iteration + 1),
    took: (durationMs) => durationWords(durationMs),
    writes: (created, changed) => workMessages.writes(created, changed),
    details: () => [],
    failure: (_entry, errorLabel) => errorLabel?.user ?? workMessages.failedWithoutReason,
  },
  developer: {
    round: (iteration) => workMessages.iteration(iteration),
    took: (durationMs) => formatDuration(durationMs),
    writes: (created, changed) => workMessages.counts(created, changed),
    details: (entry) =>
      [workMessages.steps(entry.steps.length), entry.modelId, formatCurrency(entry.costUsd)].filter(
        (detail) => detail !== null,
      ),
    failure: (entry) => entry.error,
  },
} as const satisfies Record<View, WorkWordsOfView>

/**
 * The words of a line of work in the view of the app, from `workMessages` and the labels of its
 * status and of the error of the run; null for a part the view does not show.
 */
export function useWorkWords(entry: WorkEntry, run: Pick<Run, 'error'> | null): WorkWords {
  const view = useView()
  const look = workStatusLooks[entry.status]
  const words = workWordsByView[view]
  const errorLabel = run === null ? null : runErrorLabel(run.error?.code ?? '')

  return {
    status: look.isCompleted ? null : workStatusLabels[entry.status][view],
    round: entry.iteration > 0 ? words.round(entry.iteration) : null,
    took:
      entry.durationMs !== null && (look.isCompleted || look.isFailed)
        ? words.took(entry.durationMs)
        : null,
    writes:
      entry.created.length > 0 || entry.changed.length > 0
        ? words.writes(entry.created.length, entry.changed.length)
        : null,
    details: words.details(entry),
    failure: look.isFailed ? words.failure(entry, errorLabel) : null,
  }
}
