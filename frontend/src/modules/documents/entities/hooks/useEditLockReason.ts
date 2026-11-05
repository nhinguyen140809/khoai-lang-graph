'use client'

import { editAccessMessages } from '../constants/edit-access.constants'
import { editAccessOf } from '../utils/edit-access.utils'
import { useDocumentsUnderReview } from './useDocumentsUnderReview'

/**
 * Why the document cannot change now, in the words of the user, or null when it can: the run that
 * works, the review that takes no changes, the review that does not list the document, or none.
 */
export function useEditLockReason(projectId: string, artifactId: string): string | null {
  const { run, interrupt } = useDocumentsUnderReview(projectId)
  const access = editAccessOf({ runStatus: run?.status, interrupt, artifactId })
  return access.canEdit ? null : editAccessMessages[access.reason]
}
