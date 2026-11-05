'use client'

import { useMemo } from 'react'

import {
  type ArtifactItem,
  type BreadcrumbStep,
  outlineBreadcrumb,
  outlineNeighbors,
  useHistoryView,
  useItemSchema,
} from '@/modules/artifact/entities'
import { useDocumentOutline, useEditLockReason, useItemStatus } from '@/modules/documents/entities'
import { useReloadTraces } from '@/modules/trace/entities'
import { contentFields, itemTitle, useIssueKinds } from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

const noSteps: BreadcrumbStep[] = []

/**
 * What the page of an item reads: its title, its status, the path above it, its place among the
 * items of its document, the move to another item in the tab on screen, the fields of its schema,
 * the state of the history surface, why its document cannot change, and what follows a change.
 * The history surface closes while the form is open, so the page says whether it edits.
 */
export function useItemPage(projectId: string, record: ArtifactItem, { isEditing = false } = {}) {
  const project = routes.project(projectId)
  const { schema } = useItemSchema(record)
  const issueKinds = useIssueKinds()
  const outline = useDocumentOutline(record.artifact_id)
  const status = useItemStatus(projectId, record)
  const lockedReason = useEditLockReason(projectId, record.artifact_id)
  const reloadTraces = useReloadTraces()
  // The page loads again as the agents write, whether or not the side panel is shown.
  const openPage = useOpenPage()

  const fields = useMemo(() => (schema === undefined ? [] : contentFields(schema)), [schema])
  const history = useHistoryView(record.version, { isHidden: isEditing })

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
    fields,
    // Unknown until the kinds with issues load, so an item with an open issue never shows as a draft first.
    status: issueKinds.data === undefined ? undefined : status.status,
    isUnderReview: status.isUnderReview,
    documentTitle: outline.state === 'success' ? outline.artifact.title : null,
    steps,
    neighbors,
    history,
    isHistoryOpen: history.level !== 'closed',
    lockedReason,
    reloadTraces,
    /** Opens an item in the place of the tab on screen; does nothing for no item. */
    moveTo: (target: { id: string } | null) => {
      if (target !== null) openPage(project.item(target.id), { inPlace: true })
    },
  }
}

/** What the page of an item reads, for the parts that render it. */
export type ItemPage = ReturnType<typeof useItemPage>
