'use client'

import { type ComponentType, useState } from 'react'

import {
  assetSizeClasses,
  assetSizes,
  BarChartBoard,
  defaultAssetView,
  DocumentAsset,
  type DrawnIconProps,
  EventListBoard,
  ForkNodesBoard,
  GanttBoard,
  GlobeAsset,
  KanbanBoard,
  LaptopAsset,
  LayersAsset,
  LibraryAsset,
  LineChartBoard,
  MessageSquareAsset,
  NodesBoard,
  PenAsset,
  ScatterAsset,
  SearchAsset,
  StackAsset,
  TextCenterBoard,
  TextLeftBoard,
  TextRightBoard,
  TypedLineBoard,
  UngroupBoard,
  useTurnableView,
  ZipFileAsset,
} from '@/shared/components/animation'

import type { CardEntry } from '../../../design-system.types'
import { useIconClock } from '../../../hooks/useIconClock'
import { SampleCard } from '../../Sample'
import type { iconTones } from './IconSamples'
import { IconBox, IconControls, IconGrid, IconSample, ViewSliders } from './IconSamples'

// The icons drawn as assets of thin plates, by name.
const assetIcons: readonly (readonly [string, ComponentType<DrawnIconProps>])[] = [
  ['laptop', LaptopAsset],
  ['globe', GlobeAsset],
  ['pen', PenAsset],
  ['library', LibraryAsset],
  ['search', SearchAsset],
  ['message-square', MessageSquareAsset],
  ['stack', StackAsset],
  ['scatter', ScatterAsset],
  ['layers', LayersAsset],
  ['zip', ZipFileAsset],
  ['document', DocumentAsset],
  ['gantt-board', GanttBoard],
  ['kanban-board', KanbanBoard],
]

/** The icons drawn as assets of thin plates, in every one of their sizes, turning with the angle they are seen from. */
export function AssetsCard() {
  const { isPlaying, setIsPlaying, speed, setSpeed, progress } = useIconClock()
  const [tone, setTone] = useState<(typeof iconTones)[number]>('primary')
  const [hasGuide, setHasGuide] = useState(false)
  const { view, setView, dragProps } = useTurnableView(defaultAssetView)

  return (
    <SampleCard
      title="Assets"
      description="The icons drawn as assets of thin plates, by name, every asset as large at a size as another. The gantt and kanban boards among them are told as data that moves with the clock: their marks say how they move. The sliders, or a drag on the asset itself, turn it about and tip the camera over it; the color is the one that an act can give a thing around the face, and the guide marks the area that an icon should keep to."
      className="flex flex-col gap-6"
    >
      <IconControls
        isPlaying={isPlaying}
        onPlayingChange={setIsPlaying}
        speed={speed}
        onSpeedChange={setSpeed}
        tone={tone}
        onToneChange={setTone}
        hasGuide={hasGuide}
        onGuideChange={setHasGuide}
      />
      <ViewSliders id="ds-assets-view" view={view} onViewChange={setView} />
      <IconGrid tone={tone}>
        {assetIcons.map(([name, Icon]) =>
          assetSizes.map((size) => (
            <IconSample key={`${name}-${size}`} name={`${name} ${size}`}>
              <IconBox size={assetSizeClasses[size]} hasGuide={hasGuide} dragProps={dragProps}>
                <Icon progress={progress} view={view} />
              </IconBox>
            </IconSample>
          )),
        )}
      </IconGrid>
    </SampleCard>
  )
}

export const assetsCardEntry = {
  id: 'assets',
  label: 'Assets',
  section: 'identity',
  span: 12,
  keywords:
    'asset 2.5D view yaw pitch drag turn sizes lg xl 2xl DocumentAsset GanttBoard GlobeAsset KanbanBoard LaptopAsset LayersAsset LibraryAsset MessageSquareAsset PenAsset ScatterAsset SearchAsset StackAsset ZipFileAsset gantt-board kanban-board ungroup-board',
  View: AssetsCard,
} satisfies CardEntry
