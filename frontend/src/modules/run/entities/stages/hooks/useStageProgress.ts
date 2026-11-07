'use client'

import { useMemo } from 'react'

import { useStageSubjects } from '@/modules/artifact/entities/@x/run'
import { useVisibleStages } from '@/modules/workflow/entities/@x/run'

import type { Run } from '../../runs/runs.types'
import { useRunSteps } from '../../steps/hooks/useRunStepQueries'
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
  const subjects = useStageSubjects(projectId, run?.workflow_version)
  const stageTree = stages.data
  const stepPages = steps.data?.pages
  const isError = stages.isError || steps.isError
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
    if (stageTree === undefined || stepPages === undefined) return { state: 'pending' }

    const allSteps = stepPages.flatMap(({ items }) => items)
    return {
      state: 'success',
      stages: stageProgress(stageTree, { steps: allSteps, run, subjects }),
    }
  }, [run, isError, refetchStages, refetchSteps, stageTree, stepPages, subjects])
}
