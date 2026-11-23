'use client'

import { useState } from 'react'

import type { LoadingLayout } from '@/shared/components/state'
import { LoadingState } from '@/shared/components/state'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Slider } from '@/shared/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { layoutNames } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

const rows = ['row-1', 'row-2', 'row-3']

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
      title="Skeleton and custom loading"
      description="Skeleton while items load, and a placeholder whose gap and item size the caller sets, in steps of the spacing scale."
      columns
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
      <CustomSample />
    </SampleCard>
  )
}

export const skeletonCardEntry = {
  id: 'skeleton',
  label: 'Skeleton',
  section: 'motion',
  span: 6,
  keywords: 'skeleton loading placeholder state LoadingState Skeleton Slider',
  View: SkeletonCard,
} satisfies CardEntry
