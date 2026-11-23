'use client'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'

import { priorityCounts, priorityLabels } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard } from '../../Sample'

// Each bar takes one of the chart colors; the value of each bar is also written above it.
const chartConfig = {
  count: { label: 'Requirements' },
  must: { label: priorityLabels.must, color: 'var(--chart-1)' },
  should: { label: priorityLabels.should, color: 'var(--chart-2)' },
  could: { label: priorityLabels.could, color: 'var(--chart-3)' },
  wont: { label: priorityLabels.wont, color: 'var(--chart-4)' },
} satisfies ChartConfig

const priorityBars = priorityCounts.map((row) => ({ ...row, fill: `var(--color-${row.priority})` }))

const ramp = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']

export function ChartCard() {
  return (
    <SampleCard
      title="Requirements by priority"
      description="Specification v2, 38 requirements."
      className="flex flex-col gap-3"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
        <BarChart accessibilityLayer data={priorityBars} margin={{ top: 16, left: -20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="priority"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) =>
              value in priorityLabels ? priorityLabels[value as keyof typeof priorityLabels] : value
            }
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {/* A bar shows its value too, so that its meaning does not rest on its color alone. */}
            <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={11} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="flex items-center gap-1" aria-label="Chart colors, chart-1 to chart-5">
        {ramp.map((token) => (
          <div
            key={token}
            className="h-2 flex-1 rounded-sm"
            style={{ backgroundColor: `var(--${token})` }}
          />
        ))}
      </div>
    </SampleCard>
  )
}

export const chartCardEntry = {
  id: 'chart',
  label: 'Chart',
  section: 'data',
  span: 3,
  keywords: 'chart bar requirements priority ChartContainer ChartTooltip ChartTooltipContent',
  View: ChartCard,
} satisfies CardEntry
