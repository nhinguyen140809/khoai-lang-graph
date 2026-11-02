'use client'

import { useMemo } from 'react'

import { shownRun, useProjectRunResult } from '@/modules/project/entities/@x/documents'
import { usePendingInterrupt } from '@/modules/review/entities/@x/documents'
import type { Run } from '@/modules/run/entities/@x/documents'

/**
 * The run that the project shows and the artifacts that its pending review lists, which are none
 * once the run goes on. It reads queries only and opens no stream.
 */
export function useDocumentsUnderReview(projectId: string): {
  run: Run | null
  reviewIds: ReadonlySet<string>
} {
  const run = shownRun(useProjectRunResult(projectId))
  const pending = usePendingInterrupt(run?.id ?? '', {
    isEnabled: run !== null,
    runStatus: run?.status,
  })
  const reviewIds = useMemo(
    () => new Set(pending.data?.review_artifacts.map(({ artifact_id }) => artifact_id) ?? []),
    [pending.data],
  )
  return { run, reviewIds }
}

/** Whether the pending review of the project lists the document. */
export function useIsDocumentUnderReview(projectId: string, artifactId: string): boolean {
  return useDocumentsUnderReview(projectId).reviewIds.has(artifactId)
}
