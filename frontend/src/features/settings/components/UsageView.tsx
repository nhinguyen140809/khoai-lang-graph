'use client'

import { useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useUsage } from '../hooks/useAccountQueries'
import { type UsageGroup, usageGroupLabels, usageGroups } from '../settings.types'

const number = (value: number) => value.toLocaleString('en-US')

/** The tokens and the cost of the runs of the user, grouped by day, project, agent role or model. */
export function UsageView() {
  const [groupBy, setGroupBy] = useState<UsageGroup>('day')
  const usage = useUsage(groupBy)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs">
        <label htmlFor="usage-group">Group by</label>
        <NativeSelect
          id="usage-group"
          value={groupBy}
          onChange={(event) => {
            const next = usageGroups.find((group) => group === event.target.value)
            if (next !== undefined) setGroupBy(next)
          }}
        >
          {usageGroups.map((group) => (
            <NativeSelectOption key={group} value={group}>
              {usageGroupLabels[group]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {usage.isPending && <LoadingState label="Loading your usage" rows={4} />}
      {usage.isError && (
        <ErrorState message={usage.error.message} onRetry={() => void usage.refetch()} />
      )}
      {usage.isSuccess && usage.data.items.length === 0 && (
        <EmptyState
          title="No usage yet"
          description="Your runs show here once they call a model."
        />
      )}
      {usage.isSuccess && usage.data.items.length > 0 && (
        <Table aria-label="Usage">
          <TableHeader>
            <TableRow>
              <TableHead>{usageGroupLabels[groupBy]}</TableHead>
              <TableHead className="text-right">Input</TableHead>
              <TableHead className="text-right">Output</TableHead>
              <TableHead className="text-right">Cache read</TableHead>
              <TableHead className="text-right">Cache write</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage.data.items.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-mono">{row.key}</TableCell>
                <TableCell className="text-right">{number(row.input_tokens)}</TableCell>
                <TableCell className="text-right">{number(row.output_tokens)}</TableCell>
                <TableCell className="text-right">{number(row.cache_read_tokens)}</TableCell>
                <TableCell className="text-right">{number(row.cache_write_tokens)}</TableCell>
                <TableCell className="text-right">${row.cost_usd.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{number(usage.data.total.input_tokens)}</TableCell>
              <TableCell className="text-right">{number(usage.data.total.output_tokens)}</TableCell>
              <TableCell className="text-right">
                {number(usage.data.total.cache_read_tokens)}
              </TableCell>
              <TableCell className="text-right">
                {number(usage.data.total.cache_write_tokens)}
              </TableCell>
              <TableCell className="text-right">${usage.data.total.cost_usd.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </div>
  )
}
