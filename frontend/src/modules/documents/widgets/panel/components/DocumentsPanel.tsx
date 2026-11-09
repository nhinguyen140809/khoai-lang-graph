'use client'

import { useMemo } from 'react'

import { attentionCounts, itemNodeId, useArtifactOutline } from '@/modules/artifact/entities'
import {
  type DocumentListResult,
  documentsMessages,
  useDocumentDisplays,
  useDocumentList,
  useOpenDocument,
} from '@/modules/documents/entities'
import { SidePanel, useOpenPage } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { useView } from '@/shared/lib/view'
import { routes } from '@/shared/routes'

import type { TreeNode } from '../document-tree.types'
import { documentNodeId, documentTreeNodes } from '../document-tree.utils'
import { DocumentAttentionSummary } from './DocumentAttentionSummary'
import { DocumentTree } from './DocumentTree'

type SuccessList = Extract<DocumentListResult, { state: 'success' }>

interface PanelBodyProps {
  projectId: string
  list: SuccessList
  /** The open document and its outline, or null when no document is open. */
  outline: ReturnType<typeof useArtifactOutline> | null
  openArtifactId: string | undefined
  openItemId: string | undefined
  /** Whether the open document waits for the review of the user. */
  isUnderReview: boolean
}

function PanelBody({
  projectId,
  list,
  outline,
  openArtifactId,
  openItemId,
  isUnderReview,
}: PanelBodyProps) {
  const project = routes.project(projectId)
  const openPage = useOpenPage()
  const view = useView()
  const displays = useDocumentDisplays()

  const nodes: Record<string, TreeNode> = useMemo(() => {
    const open =
      openArtifactId === undefined || outline === null
        ? null
        : {
            artifactId: openArtifactId,
            isUnderReview,
            nodes: outlineRows(outline),
          }
    return documentTreeNodes({
      entries: list.entries,
      openOutline: open,
      hrefs: { document: project.document, item: project.item },
      view,
      displays,
    })
  }, [
    list.entries,
    openArtifactId,
    outline,
    isUnderReview,
    project.document,
    project.item,
    view,
    displays,
  ])

  const currentId =
    openItemId === undefined
      ? openArtifactId === undefined
        ? undefined
        : documentNodeId(openArtifactId)
      : nodeIdOfItem(nodes, openItemId)

  const hasDocuments = list.entries.length > 0
  const counts =
    outline?.state === 'success' ? attentionCounts(outline.statuses, { isUnderReview }) : []
  const footer =
    counts.length > 0 ? (
      <DocumentAttentionSummary
        counts={counts}
        onOpenItem={(item) => {
          openPage(project.item(item.id))
        }}
      />
    ) : undefined

  return (
    <SidePanel title={documentsMessages.title} {...(footer !== undefined && { footer })}>
      {hasDocuments ? (
        <DocumentTree
          nodes={nodes}
          currentId={currentId}
          onRetry={() => {
            if (outline?.state === 'error') outline.retry()
          }}
        />
      ) : (
        <EmptyState size="compact" title={documentsMessages.empty.title} />
      )}
    </SidePanel>
  )
}

/** The rows under the open document: its outline, or the message that stands in for it. */
function outlineRows(outline: NonNullable<PanelBodyProps['outline']>) {
  if (outline.state === 'success') return outline.nodes
  return outline.state === 'error'
    ? { message: documentsMessages.outlineError, isRetry: true }
    : { message: documentsMessages.outlineLoading, isRetry: false }
}

function nodeIdOfItem(
  nodes: Readonly<Record<string, TreeNode>>,
  itemId: string,
): string | undefined {
  const id = itemNodeId(itemId)
  return id in nodes ? id : undefined
}

/** The panel with an open document: it loads the outline of that document. */
function PanelWithOutline(props: Omit<PanelBodyProps, 'outline'> & { artifactId: string }) {
  const { artifactId, ...rest } = props
  const outline = useArtifactOutline(artifactId)
  return <PanelBody {...rest} outline={outline} />
}

/**
 * The side panel of Documents: the documents of the project as a tree with the outline of the open
 * document under its row, and under the tree what asks something of the user in that document.
 */
export function DocumentsPanel({ projectId }: { projectId: string }) {
  const list = useDocumentList(projectId)
  const { artifactId, itemId } = useOpenDocument()

  if (list.state === 'pending') {
    return (
      <SidePanel title={documentsMessages.title}>
        <LoadingState size="compact" label={documentsMessages.loading} />
      </SidePanel>
    )
  }
  if (list.state === 'error') {
    return (
      <SidePanel title={documentsMessages.title}>
        <ErrorState size="compact" message={documentsMessages.loadError} onRetry={list.retry} />
      </SidePanel>
    )
  }
  if (artifactId === undefined) {
    return (
      <PanelBody
        projectId={projectId}
        list={list}
        outline={null}
        openArtifactId={undefined}
        openItemId={undefined}
        isUnderReview={false}
      />
    )
  }
  return (
    <PanelWithOutline
      projectId={projectId}
      list={list}
      artifactId={artifactId}
      openArtifactId={artifactId}
      openItemId={itemId}
      isUnderReview={list.isUnderReview(artifactId)}
    />
  )
}
