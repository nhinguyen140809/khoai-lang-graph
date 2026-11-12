'use client'

import { cn } from 'cn'
import { usePathname } from 'next/navigation'

import { useProjectId } from '@/modules/project/entities'
import {
  type LiveTraceOptions,
  useOpenIssues,
  useTraceabilityCoverage,
} from '@/modules/trace/entities'
import { ErrorState, LoadingState } from '@/shared/components/state'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Tree, TreeItem, TreeItemLabel } from '@/shared/components/ui/tree'
import { useLeavingRows } from '@/shared/lib/animation'
import { routes } from '@/shared/routes'

import { useOverviewTree } from '../hooks/useOverviewTree'
import { type OverviewRow } from '../overview.types'
import { overviewRows } from '../overview.utils'
import { tracePanelMessages } from '../trace-panel.constants'

interface OverviewSectionProps {
  /** How the queries follow the agents while they write. */
  live: LiveTraceOptions
}

/**
 * The overview of what needs attention in the project: one row per gap of the coverage, with its
 * count in the tone of its level, and the open issues. A row opens its page in the preview tab.
 */
export function OverviewSection({ live }: OverviewSectionProps) {
  const projectId = useProjectId()
  const coverage = useTraceabilityCoverage(projectId, live)
  const issues = useOpenIssues(projectId, live)
  const project = routes.project(projectId)

  if (coverage.isError) {
    return (
      <ErrorState
        size="compact"
        message={tracePanelMessages.itemsLoadError}
        onRetry={() => {
          void coverage.refetch()
        }}
      />
    )
  }
  if (coverage.data === undefined)
    return <LoadingState size="compact" label={tracePanelMessages.loading} />

  const rows = overviewRows({
    coverage: coverage.data,
    issuesCount: issues.state === 'success' ? issues.count : null,
    gapOf: (key) => project.traceGap(key),
    issues: project.traceIssues(),
  })

  return <OverviewTree rows={rows} />
}

/** The rows of the overview over the flat tree that draws them. */
function OverviewTree({ rows }: { rows: Readonly<Record<string, OverviewRow>> }) {
  const tree = useOverviewTree(rows)
  const treeRows = useLeavingRows(tree.getItems(), (item) => item.getId())
  const pathname = usePathname()

  return (
    <Tree indent={0} tree={tree} aria-label={tracePanelMessages.overview} className="pb-1">
      {treeRows.map(({ row: item, isLeaving }) => {
        const row = item.getItemData()
        const isCurrent = pathname === row.href
        return (
          <TreeItem
            key={item.getId()}
            item={item}
            isLeaving={isLeaving}
            aria-current={isCurrent ? 'page' : undefined}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <TreeItemLabel
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md py-1.5 ps-5.5! pr-2 text-left hover:bg-transparent hover:text-foreground',
                    isCurrent && 'bg-accent text-foreground hover:bg-accent',
                  )}
                >
                  {row.description !== null && <span className="sr-only">{row.description}</span>}
                  <span className="min-w-0 flex-1 truncate">{row.name}</span>
                  {row.count !== null && (
                    <Badge variant="soft" color={row.tone}>
                      {String(row.count)}
                    </Badge>
                  )}
                </TreeItemLabel>
              </TooltipTrigger>
              {row.description !== null && <TooltipContent>{row.description}</TooltipContent>}
            </Tooltip>
          </TreeItem>
        )
      })}
    </Tree>
  )
}
