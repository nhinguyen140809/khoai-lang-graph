'use client'

import { GitForkIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { routes } from '@/shared/config/routes'

import { useCoverage } from '../hooks/useCoverage'
import { useMatrix } from '../hooks/useMatrix'
import { rowsWithItems } from '../matrix-filter.utils'
import { ItemRefLinks } from './ItemRefLinks'

interface MatrixViewProps {
  projectId: string
  /** The key of a gap: only the rows with its items are shown. */
  gap: string | null
}

/** One row for each chain from a backlog item down to its sources and the words they came from. */
export function MatrixView({ projectId, gap }: MatrixViewProps) {
  const matrix = useMatrix(projectId)
  const coverage = useCoverage(projectId)
  const chosen = coverage.data?.gaps.find(({ key }) => key === gap)
  const rows = useMemo(
    () =>
      matrix.data === undefined
        ? []
        : chosen === undefined
          ? matrix.data.rows
          : rowsWithItems(matrix.data.rows, chosen.items),
    [matrix.data, chosen],
  )

  if (matrix.isPending) return <LoadingState label="Loading the matrix" rows={6} />
  if (matrix.isError) {
    return <ErrorState message={matrix.error.message} onRetry={() => void matrix.refetch()} />
  }
  if (matrix.data.rows.length === 0) {
    return (
      <EmptyState
        icon={GitForkIcon}
        title="Nothing to trace yet"
        description="The matrix fills as the agents derive requirements from the interviews."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {chosen !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span>
            Only rows of <strong>{chosen.label}</strong>: {chosen.description}
          </span>
          <Button asChild size="xs" variant="outline">
            <Link href={routes.project(projectId).traceability()}>Show all rows</Link>
          </Button>
        </div>
      )}
      <Table aria-label="Traceability matrix">
        <TableHeader>
          <TableRow>
            {matrix.data.columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {matrix.data.columns.map((column) => (
                <TableCell key={column.key}>
                  <ItemRefLinks projectId={projectId} items={row.cells[column.key] ?? []} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">No row has an item of this gap.</p>
      )}
    </div>
  )
}
