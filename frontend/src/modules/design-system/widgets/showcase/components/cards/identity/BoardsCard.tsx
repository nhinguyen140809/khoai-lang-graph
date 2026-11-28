'use client'

import { type ComponentType, useState } from 'react'

import {
  BarsIcon,
  Board,
  type BoardMark,
  type BoardShape,
  boardShapes,
  ChartSplineIcon,
  defaultAssetView,
  type DrawnIconProps,
  EventListIcon,
  ForkNodesIcon,
  GanttChartIcon,
  KanbanIcon,
  NodesIcon,
  TextCenterIcon,
  TextLeftIcon,
  TextRightIcon,
  TypedLineIcon,
  UngroupIcon,
  useTurnableView,
} from '@/shared/components/animation'

import type { CardEntry } from '../../../design-system.types'
import { useIconClock } from '../../../hooks/useIconClock'
import { SampleCard, SampleGroup } from '../../Sample'
import type { iconTones } from './IconSamples'
import { IconBox, IconControls, IconGrid, IconSample, ViewSliders } from './IconSamples'

// The icons a board can carry, by the name that the acts call them.
const boardIcons: readonly (readonly [string, ComponentType<DrawnIconProps>])[] = [
  ['bars', BarsIcon],
  ['chart-spline', ChartSplineIcon],
  ['gantt-chart', GanttChartIcon],
  ['kanban', KanbanIcon],
  ['event-list', EventListIcon],
  ['fork-nodes', ForkNodesIcon],
  ['nodes', NodesIcon],
  ['ungroup', UngroupIcon],
  ['text-left', TextLeftIcon],
  ['text-center', TextCenterIcon],
  ['text-right', TextRightIcon],
  ['typed-line', TypedLineIcon],
]

// The marks of a poster board, to show that a board takes any marks of its own: a diamond and a bar under it.
const posterMarks: readonly BoardMark[] = [
  {
    corners: [
      [0.5, 0.34],
      [0.78, 0.64],
      [0.5, 0.94],
      [0.22, 0.64],
    ],
    face: 'b',
  },
  {
    rect: { from: [0.16, 0.1], to: [0.84, 0.16] },
    face: 'a',
  },
]

/** The board, the sheet a drawing stands on, in the shapes it comes in, with the marks it is given and with an icon it carries. */
export function BoardsCard() {
  const { isPlaying, setIsPlaying, speed, setSpeed, progress } = useIconClock()
  const [tone, setTone] = useState<(typeof iconTones)[number]>('primary')
  const [hasGuide, setHasGuide] = useState(false)
  const { view, setView, dragProps } = useTurnableView(defaultAssetView)

  return (
    <SampleCard
      title="Boards"
      description="The board, the sheet a drawing stands on, in the shapes it comes in, with the marks it is given and with an icon it carries. The marks are told as data, and say how they move: they slide and drift with the clock, as the icons a clock draws stroke by stroke do. The sliders, or a drag on the board itself, turn it about and tip the camera over it."
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
      <ViewSliders id="ds-boards-view" view={view} onViewChange={setView} />
      <SampleGroup label="The shapes of a board">
        <IconGrid tone={tone}>
          {(Object.keys(boardShapes) as BoardShape[]).map((shape) => (
            <IconSample key={shape} name={`board ${shape}`}>
              <IconBox size="size-20" hasGuide={hasGuide} dragProps={dragProps}>
                <Board progress={progress} stroke={1.5} view={view} shape={shape} />
              </IconBox>
            </IconSample>
          ))}
          <IconSample name="board with its own marks">
            <IconBox size="size-20" hasGuide={hasGuide} dragProps={dragProps}>
              <Board
                progress={progress}
                stroke={1.5}
                view={view}
                shape="square"
                marks={posterMarks}
              />
            </IconBox>
          </IconSample>
        </IconGrid>
      </SampleGroup>
      <SampleGroup label="A board that carries an icon">
        <IconGrid tone={tone}>
          {boardIcons.map(([name, Icon]) => (
            <IconSample key={name} name={`board ${name}`}>
              <IconBox size="size-20" hasGuide={hasGuide} dragProps={dragProps}>
                <Board progress={progress} stroke={1.5} view={view} shape="panel" icon={Icon} />
              </IconBox>
            </IconSample>
          ))}
        </IconGrid>
      </SampleGroup>
    </SampleCard>
  )
}

export const boardsCardEntry = {
  id: 'boards',
  label: 'Boards',
  section: 'identity',
  span: 12,
  keywords: 'board shapes marks sheet square panel banner carry icon carried Board BoardMark',
  View: BoardsCard,
} satisfies CardEntry
