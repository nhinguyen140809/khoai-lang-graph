'use client'

import { useReloadArtifacts } from '@/modules/artifact/entities/@x/documents'
import { useArtifactsInProgress } from '@/modules/run/entities/@x/documents'

import { useDocumentsUnderReview } from './useDocumentsUnderReview'

/**
 * The artifacts that the node in progress of the running run writes. While a screen uses it, the
 * artifacts and the items it shows load again after each artifact is created and each node ends.
 * The stream of the run is shared with every other part of the app that follows the run.
 */
export function useWritingArtifacts(projectId: string): ReadonlySet<string> {
  const { run } = useDocumentsUnderReview(projectId)
  const reload = useReloadArtifacts()
  return useArtifactsInProgress(run, reload)
}
