'use client'

import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useStageSubjects } from '@/modules/artifact/entities/@x/run'
import { useVisibleStages } from '@/modules/workflow/entities/@x/run'

import { useThreadRuns } from '../../runs/hooks/useRunQueries'
import type { Run } from '../../runs/runs.types'
import { retriedRunsOf } from '../../runs/runs.utils'
import { useRunSteps } from '../../steps/hooks/useRunStepQueries'
import { listRunSteps } from '../../steps/run-steps.api'
import { runStepsPageSize } from '../../steps/run-steps.constants'
import { runStepKeys } from '../../steps/run-steps.keys'
import type { StageProgressResult } from '../stage-progress.types'
import { stageProgress } from '../stage-progress.utils'

/**
 * The stages of the workflow of a run with their progress, their nested stages and their subjects.
 * The subjects failing to load leaves them out; a null run gives no stage, so the panel shows its
 * empty state. Only a reload of what it reads or a change of the run computes the tree again: a
 * switch of the view or a new target entry computes nothing.
 */
export function useStageProgress(run: Run | null, projectId: string): StageProgressResult {
  const stages = useVisibleStages(run?.workflow_version)
  const steps = useRunSteps(run?.id ?? '', {
    isEnabled: run !== null,
    runStatus: run?.status,
  })
  const earlier = useEarlierRuns(run)
  const subjects = useStageSubjects(projectId, run?.workflow_version)
  const stageTree = stages.data
  const stepPages = steps.data?.pages
  const isError = stages.isError || steps.isError || earlier.isError
  const { refetch: refetchStages } = stages
  const { refetch: refetchSteps } = steps

  return useMemo<StageProgressResult>(() => {
    if (run === null) return { state: 'success', stages: [] }
    if (isError) {
      return {
        state: 'error',
        retry: () => {
          void refetchStages()
          void refetchSteps()
        },
      }
    }
    if (stageTree === undefined || stepPages === undefined || earlier.isPending) {
      return { state: 'pending' }
    }

    const allSteps = stepPages.flatMap(({ items }) => items)
    return {
      state: 'success',
      stages: stageProgress(stageTree, {
        steps: allSteps,
        earlierRuns: earlier.runs,
        run,
        subjects,
      }),
    }
  }, [run, isError, refetchStages, refetchSteps, stageTree, stepPages, earlier, subjects])
}

/**
 * The steps of the runs that the run retried from. A retry starts its own steps over, so the
 * stages before the step it retried from have their steps in those runs. Each run gives its
 * first page of steps, as the runs before the latest have ended.
 */
function useEarlierRuns(run: Run | null) {
  const runs = useThreadRuns(run?.thread_id ?? '', { isEnabled: run?.retry_of_run_id != null })
  const retried = useMemo(
    () =>
      run === null ? [] : retriedRunsOf(run, runs.data?.pages.flatMap(({ items }) => items) ?? []),
    [run, runs.data],
  )
  const isRetry = run?.retry_of_run_id != null
  const queries = useQueries({
    queries: retried.map(({ id }) => ({
      queryKey: runStepKeys.firstPageOfRun(id),
      queryFn: () => listRunSteps(id, null, runStepsPageSize),
    })),
  })
  return {
    isError: runs.isError || queries.some(({ isError }) => isError),
    isPending: isRetry && (runs.isPending || queries.some(({ isPending }) => isPending)),
    runs: queries.map(({ data }) => data?.items ?? []),
  }
}
