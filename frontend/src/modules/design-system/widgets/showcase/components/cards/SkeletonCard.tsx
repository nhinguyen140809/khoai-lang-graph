'use client'

import { useState } from 'react'

import type { LoadingLayout } from '@/shared/components/state'
import { LoadingState } from '@/shared/components/state'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Slider } from '@/shared/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

const rows = ['row-1', 'row-2', 'row-3']

const layouts: {
  layout: LoadingLayout
  rows: number
  columns?: number
  alternate?: boolean
  note: string
}[] = [
  { layout: 'lines', rows: 3, note: 'text rows' },
  {
    layout: 'lines',
    rows: 3,
    alternate: true,
    note: 'rows take turns at each side, as a chat does',
  },
  { layout: 'list', rows: 3, note: 'a mark and two lines' },
  { layout: 'cards', rows: 2, note: 'boxes with a title' },
  { layout: 'grid', rows: 1, columns: 3, note: 'blocks in columns' },
  { layout: 'table', rows: 3, columns: 3, note: 'rows of cells' },
  { layout: 'feed', rows: 2, note: 'entries with an avatar' },
  { layout: 'document', rows: 2, note: 'a heading and paragraphs' },
  { layout: 'detail', rows: 2, note: 'a title, tags and sections' },
]

// The layouts once each: a layout may show twice in the samples, with another option.
const layoutNames = [...new Set(layouts.map((entry) => entry.layout))]

function CustomSample() {
  const [layout, setLayout] = useState<LoadingLayout>('cards')
  const [gap, setGap] = useState(4)
  const [itemHeight, setItemHeight] = useState(20)
  const [height, setHeight] = useState(320)
  const [width, setWidth] = useState<'full' | 'narrow'>('full')

  return (
    <SampleGroup label="Gap and height of an item set by the caller">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={layout}
        onValueChange={(next) => {
          const chosen = layoutNames.find((name) => name === next)
          if (chosen !== undefined) setLayout(chosen)
        }}
        aria-label="Layout of the placeholder"
        className="flex-wrap"
      >
        {layoutNames.map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={width}
        onValueChange={(next) => {
          if (next === 'full' || next === 'narrow') setWidth(next)
        }}
        aria-label="Width of the placeholder"
      >
        <ToggleGroupItem value="full">full width</ToggleGroupItem>
        <ToggleGroupItem value="narrow">narrow</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex items-center gap-3">
        <SampleLabel className="w-24">gap {gap}</SampleLabel>
        <Slider
          min={0}
          max={12}
          step={1}
          value={[gap]}
          onValueChange={([next]) => {
            setGap(next ?? 0)
          }}
          aria-label="Gap between items"
        />
      </div>
      <div className="flex items-center gap-3">
        <SampleLabel className="w-24">height {itemHeight}</SampleLabel>
        <Slider
          min={4}
          max={48}
          step={2}
          value={[itemHeight]}
          onValueChange={([next]) => {
            setItemHeight(next ?? 4)
          }}
          aria-label="Height of an item"
        />
      </div>
      <div className="flex items-center gap-3">
        <SampleLabel className="w-24">box {height}px</SampleLabel>
        <Slider
          min={120}
          max={560}
          step={20}
          value={[height]}
          onValueChange={([next]) => {
            setHeight(next ?? 120)
          }}
          aria-label="Height of the box that holds the placeholder"
        />
      </div>
      <div className="overflow-hidden rounded-md border" style={{ height }}>
        <LoadingState
          label="Custom placeholder"
          layout={layout}
          width={width}
          rows={3}
          columns={3}
          gap={gap}
          itemHeight={itemHeight}
        />
      </div>
    </SampleGroup>
  )
}

export function SkeletonCard() {
  return (
    <SampleCard
      title="Loading"
      description="Skeleton while items load. The placeholder takes the shape of the content it stands in for, fills the width and the height of its container (a layout adds rows, or makes its blocks taller), and lets the caller set the gap and the size of an item, in steps of the spacing scale."
      className="flex flex-col gap-5"
    >
      <SampleGroup label="Skeleton">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </SampleGroup>
      {layouts.map((entry) => (
        <SampleGroup
          key={entry.note}
          label={`LoadingState layout="${entry.layout}": ${entry.note}`}
        >
          <div className="h-72 overflow-hidden rounded-md border">
            <LoadingState
              label={`Loading ${entry.layout}`}
              layout={entry.layout}
              rows={entry.rows}
              columns={entry.columns}
              alternate={entry.alternate}
            />
          </div>
        </SampleGroup>
      ))}
      <CustomSample />
    </SampleCard>
  )
}
