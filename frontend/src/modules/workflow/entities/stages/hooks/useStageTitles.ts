'use client'

import { useMemo } from 'react'

import type { WorkflowRef } from '../../workflow-ref/workflow-ref.types'
import { stageTitlesOf } from '../stage-titles.utils'
import { useVisibleStages } from './useStageQueries'

/** The title of each stage of a workflow at a version, by its key. */
export function useStageTitles(workflow: WorkflowRef | undefined): ReadonlyMap<string, string> {
  const stages = useVisibleStages(workflow)
  return useMemo(() => stageTitlesOf(stages.data ?? []), [stages.data])
}
