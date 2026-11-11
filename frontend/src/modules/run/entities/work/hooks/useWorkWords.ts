'use client'

import { inView, useView } from '@/shared/lib/view'

import { runErrorLabel } from '../../runs/run-error.utils'
import type { Run } from '../../runs/runs.types'
import { durationWords } from '../duration-words.utils'
import { workMessages, workStatusLabels } from '../work.constants'
import type { WorkEntry, WorkWords } from '../work.types'
import { workStatusLooks } from '../work-status-look.constants'

/**
 * The words of a line of work in the view of the app, from `workMessages` and the labels of its
 * status and of the error of the run; null for a part that the line does not show.
 */
export function useWorkWords(entry: WorkEntry, run: Pick<Run, 'error'> | null): WorkWords {
  const view = useView()
  const look = workStatusLooks[entry.status]
  const errorLabel = run === null ? null : runErrorLabel(run.error?.code ?? '')
  const failureWords =
    errorLabel === null ? workMessages.failedWithoutReason : inView(errorLabel, view)

  return {
    status: look.isCompleted ? null : inView(workStatusLabels[entry.status], view),
    continued: entry.continues ? workMessages.continued : null,
    round: entry.iteration > 0 ? workMessages.round(entry.iteration + 1) : null,
    took:
      entry.durationMs !== null && (look.isCompleted || look.isFailed)
        ? durationWords(entry.durationMs)
        : null,
    writes:
      entry.created.length > 0 || entry.changed.length > 0
        ? workMessages.writes(entry.created.length, entry.changed.length)
        : null,
    failure: look.isFailed ? failureWords : null,
  }
}
