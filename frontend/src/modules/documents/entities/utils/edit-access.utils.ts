import type { Interrupt } from '@/modules/review/entities/@x/documents'
import type { RunStatus } from '@/modules/run/entities/@x/documents'
import { isWritingRunStatus } from '@/modules/run/entities/@x/documents'

import type { EditAccess } from '../types/documents.types'

/**
 * When a document can change (decision 9): only while the run of the project waits at a review
 * whose interrupt allows edits and lists the document. The first state that holds gives the
 * reason; the run that works, the review that takes no changes, the review that does not list
 * the document, and no review at all.
 */
export function editAccessOf(state: {
  runStatus: RunStatus | undefined
  interrupt: Pick<Interrupt, 'allow_edits' | 'review_artifacts'> | null
  artifactId: string
}): EditAccess {
  if (state.runStatus !== undefined && isWritingRunStatus(state.runStatus)) {
    return { canEdit: false, reason: 'agentsWorking' }
  }
  if (state.runStatus === 'interrupted') {
    if (state.interrupt === null) return { canEdit: false, reason: 'noReview' }
    if (!state.interrupt.allow_edits) {
      return { canEdit: false, reason: 'reviewTakesNoChanges' }
    }
    const isListed = state.interrupt.review_artifacts.some(
      ({ artifact_id }) => artifact_id === state.artifactId,
    )
    return isListed ? { canEdit: true } : { canEdit: false, reason: 'notUnderReview' }
  }
  return { canEdit: false, reason: 'noReview' }
}
