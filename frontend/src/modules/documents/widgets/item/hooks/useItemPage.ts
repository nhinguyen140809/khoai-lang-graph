'use client'

import { useMemo } from 'react'

import {
  type ArtifactItem,
  type BreadcrumbStep,
  itemStatus,
  outlineBreadcrumb,
  outlineNeighbors,
  useArtifactOutline,
  useItemSchema,
} from '@/modules/artifact/entities'
import { useIsDocumentUnderReview, useWritingArtifacts } from '@/modules/documents/entities'
import { itemTitle, useIssueKinds } from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

const noSteps: BreadcrumbStep[] = []

/**
 * What the page of an item reads: its title, its status, the path above it, its place among the
 * items of its document, and the move to another item in the tab on screen.
 */
export function useItemPage(projectId: string, record: ArtifactItem) {
  const project = routes.project(projectId)
  const { schema } = useItemSchema(record)
  const issueKinds = useIssueKinds()
  const isUnderReview = useIsDocumentUnderReview(projectId, record.artifact_id)
  const outline = useArtifactOutline(record.artifact_id)
  // The page loads again as the agents write, whether or not the side panel is shown.
  useWritingArtifacts(projectId)
  const openPage = useOpenPage()

  const title = itemTitle(schema, record)

  const nodes = outline.state === 'success' ? outline.nodes : undefined
  const neighbors = useMemo(() => outlineNeighbors(nodes ?? [], record.id), [nodes, record.id])
  const steps = useMemo(
    () => (outline.state === 'success' ? outlineBreadcrumb(record, outline) : noSteps),
    [outline, record],
  )

  return {
    title,
    schema,
    // Unknown until the kinds with issues load, so an item with an open issue never shows as a draft first.
    status: issueKinds.data === undefined ? undefined : itemStatus(record, issueKinds.data),
    isUnderReview,
    documentTitle: outline.state === 'success' ? outline.artifact.title : null,
    steps,
    neighbors,
    /** Opens an item in the place of the tab on screen; does nothing for no item. */
    moveTo: (target: { id: string } | null) => {
      if (target !== null) openPage(project.item(target.id), { inPlace: true })
    },
  }
}
