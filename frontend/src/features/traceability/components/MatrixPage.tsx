'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useProjectTrace } from '../hooks/useTraceability'
import type { MatrixRow } from '../traceability.api'

interface MatrixPageProps {
  projectId: string
}

const columns = [
  { field: 'backlog', label: 'Backlog' },
  { field: 'spec', label: 'Spec' },
  { field: 'analyzed', label: 'Analyzed' },
  { field: 'source', label: 'Source' },
  { field: 'evidence', label: 'Evidence' },
] as const

/**
 * The matrix: one row per `derived_from` chain, from the backlog item down to
 * the raw source with its interview evidence; a missing link reads `-`. Every
 * key opens the item.
 */
export function MatrixPage({ projectId }: MatrixPageProps) {
  const { matrix } = useProjectTrace(projectId)
  const searchParams = useSearchParams()
  const gap = searchParams.get('gap')
  const onlyGaps = searchParams.get('gaps') === '1'

  useEditorTab(featureTabGroup(projectId, 'traceability'), {
    id: 'matrix',
    title: 'Matrix',
    href: `/projects/${encodeURIComponent(projectId)}/traceability`,
    icon: 'view',
  })

  if (matrix.isPending) {
    return <LoadingState label="Loading the matrix" rows={6} className="p-6" />
  }
  if (matrix.isError) {
    return (
      <ErrorState
        message={matrix.error.message}
        onRetry={() => void matrix.refetch()}
        className="p-6"
      />
    )
  }

  const rows = matrix.data.rows
  const visible = rows.filter((row) => {
    if (gap === 'backlog' && row.spec !== null) return false
    if (gap === 'spec' && !(row.spec !== null && row.backlog === null)) return false
    if (gap === 'analyzed' && !(row.spec !== null && row.analyzed === null)) return false
    if (gap === 'source' && !(row.analyzed !== null && row.source.length === 0)) return false
    if (
      onlyGaps &&
      row.backlog !== null &&
      row.spec !== null &&
      row.analyzed !== null &&
      row.source.length > 0 &&
      row.evidence.length > 0
    )
      return false
    return true
  })

  return (
    <article className="flex min-w-0 flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Matrix</h1>
      {visible.length === 0 ? (
        <EmptyState
          title="Nothing to show"
          description="The workflow has not written a chain for this filter yet."
          size="compact"
        />
      ) : (
        <Table>
          <TableCaption className="sr-only">
            One row per chain from a backlog item to its source and evidence
          </TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.field}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <MatrixRowView key={rowKey(row)} row={row} projectId={projectId} />
            ))}
          </TableBody>
        </Table>
      )}
    </article>
  )
}

function rowKey(row: MatrixRow): string {
  return (
    row.backlog?.id ??
    row.spec?.id ??
    row.analyzed?.id ??
    row.source[0]?.id ??
    row.evidence[0]?.id ??
    'row'
  )
}

function MatrixRowView({ row, projectId }: { row: MatrixRow; projectId: string }) {
  return (
    <TableRow>
      {columns.map((column) => {
        const value = row[column.field]
        const entries =
          value === null
            ? []
            : Array.isArray(value)
              ? (value as { id: string; key: string }[])
              : [value as { id: string; key: string }]
        return (
          <TableCell key={column.field} className="font-mono text-sm">
            {entries.length === 0 ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              entries.map((entry, index) => (
                <span key={entry.id}>
                  {index > 0 ? ', ' : ''}
                  <Link
                    href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(entry.id)}`}
                    className="static z-0 underline-offset-2 hover:underline"
                  >
                    {entry.key}
                  </Link>
                </span>
              ))
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
