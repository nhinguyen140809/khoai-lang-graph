'use client'

import { type ComponentType, useState } from 'react'

import {
  BarsIcon,
  ChartSplineIcon,
  CheckIcon,
  CircleHelpIcon,
  CodeIcon,
  DownloadIcon,
  DrawnDotIcon,
  type DrawnIconProps,
  EventListIcon,
  ForkNodesIcon,
  GanttChartIcon,
  KanbanIcon,
  LinkIcon,
  NodesIcon,
  TextCenterIcon,
  TextLeftIcon,
  TextRightIcon,
  TypedLineIcon,
  UngroupIcon,
} from '@/shared/components/animation'

import type { CardEntry } from '../../../design-system.types'
import { useIconClock } from '../../../hooks/useIconClock'
import { SampleCard } from '../../Sample'
import type { iconTones } from './IconSamples'
import { IconBox, IconControls, IconGrid, IconSample } from './IconSamples'

// The icons that a clock draws stroke by stroke, by the name that the acts call them. The laptop,
// the globe and the pen are drawn as assets now, so they stand in the card of the assets, not here.
const drawnIcons: readonly (readonly [string, ComponentType<DrawnIconProps>])[] = [
  ['bars', BarsIcon],
  ['chart-spline', ChartSplineIcon],
  ['check', CheckIcon],
  ['circle-help', CircleHelpIcon],
  ['code', CodeIcon],
  ['download', DownloadIcon],
  ['event-list', EventListIcon],
  ['fork-nodes', ForkNodesIcon],
  ['gantt-chart', GanttChartIcon],
  ['kanban', KanbanIcon],
  ['link', LinkIcon],
  ['nodes', NodesIcon],
  ['text-left', TextLeftIcon],
  ['text-center', TextCenterIcon],
  ['text-right', TextRightIcon],
  ['typed-line', TypedLineIcon],
  ['ungroup', UngroupIcon],
  ['drawn-dot', DrawnDotIcon],
]

/** The icons that a clock draws stroke by stroke, which the acts use, each large and as small as the interface uses it. */
export function DrawnIconsCard() {
  const { isPlaying, setIsPlaying, speed, setSpeed, progress } = useIconClock()
  const [stroke, setStroke] = useState(1.5)
  const [tone, setTone] = useState<(typeof iconTones)[number]>('primary')
  const [hasGuide, setHasGuide] = useState(false)

  return (
    <SampleCard
      title="Drawn icons"
      description="The icons that a clock draws stroke by stroke, which the acts use, with their name. The stroke and the color are the ones that an act can give a thing around the face; the guide marks the area that an icon should keep to."
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
        stroke={stroke}
        onStrokeChange={setStroke}
      />
      <IconGrid tone={tone}>
        {drawnIcons.map(([name, Icon]) => (
          <IconSample key={name} name={name}>
            <IconBox size="size-10" hasGuide={hasGuide}>
              <Icon progress={progress} stroke={stroke} />
            </IconBox>
            <IconBox size="size-4" hasGuide={hasGuide}>
              <Icon progress={progress} stroke={stroke} />
            </IconBox>
          </IconSample>
        ))}
      </IconGrid>
    </SampleCard>
  )
}

export const drawnIconsCardEntry = {
  id: 'drawn-icons',
  label: 'Drawn icons',
  section: 'identity',
  span: 6,
  keywords:
    'icon lucide animated clock stroke BarsIcon ChartSplineIcon CheckIcon CircleHelpIcon CodeIcon DotIcon DrawnDotIcon DownloadIcon EventListIcon ExclamationIcon ForkNodesIcon GanttChartIcon KanbanIcon LinkIcon NodesIcon TextCenterIcon TextLeftIcon TextRightIcon TypedLineIcon UngroupIcon',
  View: DrawnIconsCard,
} satisfies CardEntry
