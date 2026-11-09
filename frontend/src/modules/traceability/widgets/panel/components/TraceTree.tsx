'use client'

import { cn } from 'cn'
import { useCallback, useMemo } from 'react'

import { type KindView, useKindViews } from '@/modules/artifact/entities'
import {
  type DocumentListResult,
  useDocumentList,
  useOpenDocument,
} from '@/modules/documents/entities'
import { useProjectId } from '@/modules/project/entities'
import {
  type LiveTraceOptions,
  type OpenIssuesResult,
  type TraceAttentionResult,
  useOpenIssues,
  useTraceAttention,
} from '@/modules/trace/entities'
import {
  type IssueKind,
  useArtifactItemKinds,
  useArtifactKinds,
  useIssueKinds,
} from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import { ErrorState, LoadingState } from '@/shared/components/state'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Tree, TreeItem, TreeItemLabel } from '@/shared/components/ui/tree'
import { routes } from '@/shared/routes'

import { useTraceTree } from '../hooks/useTraceTree'
import { tracePanelMessages } from '../trace-panel.constants'
import type { DocumentOutlineInput } from '../trace-tree.types'
import { outlineNodesOf, traceRows } from '../trace-tree.utils'

interface TraceTreeSectionProps {
  /** How the queries follow the agents while they write. */
  live: LiveTraceOptions
}

/**
 * The tree of the documents of the project, each with the items of its outline: an item row carries
 * the mark of its level of attention, with its reasons in a tooltip, and choosing one opens its
 * chain. The items come from the read of every item of the project that the panel already makes,
 * so every document draws its items on load, whatever the page on screen.
 */
export function TraceTreeSection({ live }: TraceTreeSectionProps) {
  const projectId = useProjectId()
  const list = useDocumentList(projectId)
  const attention = useTraceAttention(projectId, live)
  const issues = useOpenIssues(projectId, live)
  const kinds = useArtifactKinds()
  const kindViews = useKindViews()
  const itemKindsByKind = useArtifactItemKinds()
  const issueKinds = useIssueKinds()
  const { itemId } = useOpenDocument()

  if (list.state === 'error') {
    return (
      <ErrorState
        size="compact"
        message={tracePanelMessages.itemsLoadError}
        onRetry={() => {
          list.retry()
        }}
      />
    )
  }
  if (issues.state === 'error') {
    return (
      <ErrorState
        size="compact"
        message={tracePanelMessages.itemsLoadError}
        onRetry={() => {
          issues.retry()
        }}
      />
    )
  }
  if (kinds.isError || itemKindsByKind.isError || issueKinds.isError) {
    return (
      <ErrorState
        size="compact"
        message={tracePanelMessages.itemsLoadError}
        onRetry={() => {
          void kinds.refetch()
          void itemKindsByKind.refetch()
          void issueKinds.refetch()
        }}
      />
    )
  }
  if (
    list.state !== 'success' ||
    issues.state !== 'success' ||
    kindViews === undefined ||
    itemKindsByKind.data === undefined ||
    issueKinds.data === undefined
  )
    return <LoadingState size="compact" label={tracePanelMessages.loading} />

  return (
    <TraceTreeBody
      list={list}
      issues={issues}
      attention={attention}
      kindViews={kindViews}
      itemKinds={itemKindsByKind.data}
      issueKinds={issueKinds.data}
      currentItemId={itemId}
    />
  )
}

interface TraceTreeBodyProps {
  list: Extract<DocumentListResult, { state: 'success' }>
  issues: Extract<OpenIssuesResult, { state: 'success' }>
  attention: TraceAttentionResult
  /** The view of every kind, from which each outline reads its titles and its display. */
  kindViews: ReadonlyMap<string, KindView>
  /** The kinds of item that each kind of artifact holds, in the order of its definition. */
  itemKinds: ReadonlyMap<string, string[]>
  issueKinds: readonly IssueKind[]
  /** The item on screen, if the page shows one; its row reads as the current one. */
  currentItemId: string | undefined
}

/** The tree of the documents and their items, over the rows its builder draws. */
function TraceTreeBody({
  list,
  issues,
  attention,
  kindViews,
  itemKinds,
  issueKinds,
  currentItemId,
}: TraceTreeBodyProps) {
  const projectId = useProjectId()
  // One stable function, so that the rows it builds do not come back with every render.
  const itemTrace = useCallback(
    (itemId: string) => routes.project(projectId).itemTrace(itemId),
    [projectId],
  )

  const documents = useMemo(() => {
    const ofProject: DocumentOutlineInput[] = []
    for (const entry of list.entries) {
      if (entry.type === 'document') {
        if (entry.artifact !== null)
          ofProject.push({
            artifact: entry.artifact,
            itemKinds: itemKinds.get(entry.artifact.kind) ?? [],
          })
      } else {
        for (const document of entry.documents)
          ofProject.push({
            artifact: document.artifact,
            itemKinds: itemKinds.get(document.artifact.kind) ?? [],
          })
      }
    }
    return ofProject
  }, [list.entries, itemKinds])

  const outlines = useMemo(
    () => outlineNodesOf({ documents, items: issues.items, kinds: kindViews, issueKinds }),
    [documents, issues.items, kindViews, issueKinds],
  )
  const rows = useMemo(
    () => traceRows({ entries: list.entries, outlines, attention, itemTrace }),
    [list.entries, outlines, attention, itemTrace],
  )

  const { tree, indent } = useTraceTree(rows.rows)
  const openPage = useOpenPage()
  const currentRowId = currentItemId === undefined ? undefined : rows.rowOfItem.get(currentItemId)

  return (
    <Tree
      indent={indent}
      tree={tree}
      guides
      aria-label={tracePanelMessages.documents}
      className="pb-2"
    >
      {tree.getItems().map((item) => {
        const row = item.getItemData()
        const isCurrent = item.getId() === currentRowId
        return (
          <TreeItem
            key={item.getId()}
            item={item}
            aria-current={isCurrent ? 'page' : undefined}
            onDoubleClick={() => {
              if (row.href !== null) openPage(row.href, { keep: true, title: row.name })
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <TreeItemLabel
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md py-1 pr-2 text-left hover:bg-transparent hover:text-foreground',
                    isCurrent && 'bg-accent text-foreground hover:bg-accent',
                  )}
                >
                  {row.reasons !== null && <span className="sr-only">{row.reasons.join(' ')}</span>}
                  {row.tone === null ? (
                    <span className="min-w-0 flex-1 truncate text-left">{row.name}</span>
                  ) : (
                    <ColoredText color={row.tone} className="min-w-0 flex-1 truncate text-left">
                      {row.name}
                    </ColoredText>
                  )}
                </TreeItemLabel>
              </TooltipTrigger>
              {row.reasons !== null && (
                <TooltipContent>
                  {row.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                </TooltipContent>
              )}
            </Tooltip>
          </TreeItem>
        )
      })}
    </Tree>
  )
}
