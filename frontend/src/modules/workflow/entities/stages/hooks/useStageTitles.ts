'use client'

import { useMemo } from 'react'

import { stageTitlesOf } from '../stage-titles.utils'
import { useVisibleStages } from './useStageQueries'

/** The title of each stage of a version of the workflow, by its key. */
export function useStageTitles(version: number | undefined): ReadonlyMap<string, string> {
  const stages = useVisibleStages(version)
  return useMemo(() => stageTitlesOf(stages.data ?? []), [stages.data])
}
