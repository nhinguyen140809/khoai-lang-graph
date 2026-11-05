'use client'

import type { ArtifactItem, ItemStatus } from '@/modules/artifact/entities/@x/documents'
import { itemStatus } from '@/modules/artifact/entities/@x/documents'
import { useOutOfDateItemIds } from '@/modules/trace/entities/@x/documents'
import { useIssueKinds } from '@/modules/workflow/entities/@x/documents'

import { useDocumentsUnderReview } from './useDocumentsUnderReview'

/**
 * The status of one item as its document shows it, and whether the document waits for the review;
 * `status` is undefined until the issue kinds load. The items made from an older version of an
 * item they link to read `outOfDate`.
 */
export function useItemStatus(
  projectId: string,
  item: Pick<
    ArtifactItem,
    'id' | 'kind' | 'content' | 'review_status' | 'updated_by' | 'artifact_id'
  >,
): { status: ItemStatus | undefined; isUnderReview: boolean } {
  const { data: issueKinds } = useIssueKinds()
  const outOfDateIds = useOutOfDateItemIds(item.artifact_id)
  const { reviewIds } = useDocumentsUnderReview(projectId)

  return {
    status: issueKinds === undefined ? undefined : itemStatus(item, issueKinds, { outOfDateIds }),
    isUnderReview: reviewIds.has(item.artifact_id),
  }
}
