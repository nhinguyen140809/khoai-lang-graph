'use client'

import { cn } from 'cn'
import { useMotionValue } from 'motion/react'
import { type ComponentType, type ReactNode, useState } from 'react'

import {
  BarsIcon,
  ChartSplineIcon,
  CheckIcon,
  CircleHelpIcon,
  CodeIcon,
  DownloadIcon,
  type DrawnIconProps,
  EventListIcon,
  ForkNodesIcon,
  GanttChartIcon,
  GlobeIcon,
  KanbanIcon,
  LaptopIcon,
  LayersIcon,
  LibraryIcon,
  LinkIcon,
  MessageSquareIcon,
  NodesIcon,
  PenIcon,
  SearchIcon,
  SendIcon,
  SpinningIcon,
  TextCenterIcon,
  TextLeftIcon,
  TextRightIcon,
  TypedLineIcon,
  UngroupIcon,
  ZipFileIcon,
} from '@/shared/components/animation'
import { DotIcon, ExclamationIcon, PauseSolidIcon, ZapSolidIcon } from '@/shared/components/icon'
import { Toggle } from '@/shared/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import { useClock } from '@/shared/lib/animation'

import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

// The icons that a clock draws, by the name that the acts call them.
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
  ['globe', GlobeIcon],
  ['kanban', KanbanIcon],
  ['laptop', LaptopIcon],
  ['layers', LayersIcon],
  ['library', LibraryIcon],
  ['link', LinkIcon],
  ['message-square', MessageSquareIcon],
  ['nodes', NodesIcon],
  ['pen', PenIcon],
  ['search', SearchIcon],
  ['send', SendIcon],
  ['text-left', TextLeftIcon],
  ['text-center', TextCenterIcon],
  ['text-right', TextRightIcon],
  ['typed-line', TypedLineIcon],
  ['ungroup', UngroupIcon],
  ['zip-file', ZipFileIcon],
]

// The icons of our own that lucide does not have, and the one that turns by itself; they take a
// class for their size, as lucide icons do.
const ownIcons: readonly (readonly [string, ComponentType<{ className?: string }>])[] = [
  ['dot', DotIcon],
  ['exclamation', ExclamationIcon],
  ['pause-solid', PauseSolidIcon],
  ['zap-solid', ZapSolidIcon],
  ['spinning', SpinningIcon],
]

// How long one round of a drawn icon takes, for each speed.
const speeds = { slow: 4800, normal: 2400, fast: 1200 } as const

type Speed = keyof typeof speeds

// How far in from the edge of its frame the area that an icon keeps to starts: 2 units of 24.
const guideInset = `${String((2 / 24) * 100)}%`

// The strokes to try, in units of the 24 by 24 frame of an icon; 1.5 is the default.
const strokes = [1, 1.25, 1.5, 2, 2.5] as const

// The colors that an act may give a thing around the face.
const tones = ['primary', 'foreground', 'muted'] as const

/** The icons of our own, each large and at the size that the interface uses (16px), the drawn ones going round on one clock that can be paused and sped up. */
export function IconsCard() {
  const [speed, setSpeed] = useState<Speed>('normal')
  const [isPlaying, setIsPlaying] = useState(true)
  const [stroke, setStroke] = useState<number>(1.5)
  const [tone, setTone] = useState<(typeof tones)[number]>('primary')
  const [hasGuide, setHasGuide] = useState(false)
  const progress = useMotionValue(0)
  useClock(progress, { durationMs: speeds[speed], start: 0, isMirrored: false }, isPlaying)

  return (
    <SampleCard
      title="Icons"
      description="The icons that we draw ourselves, with their name: the ones that a clock draws stroke by stroke, which the acts use, and the ones that lucide does not have. Each shows large and as small as the interface uses it. The stroke and the color are the ones that an act can give a thing around the face; the guide marks the area that an icon should keep to."
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Toggle variant="outline" size="sm" pressed={isPlaying} onPressedChange={setIsPlaying}>
          {isPlaying ? 'Playing' : 'Paused'}
        </Toggle>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={speed}
          onValueChange={(value) => {
            if (value !== '') setSpeed(value as Speed)
          }}
        >
          {(Object.keys(speeds) as Speed[]).map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Stroke"
          value={String(stroke)}
          onValueChange={(value) => {
            if (value !== '') setStroke(Number(value))
          }}
        >
          {strokes.map((value) => (
            <ToggleGroupItem key={value} value={String(value)}>
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Color"
          value={tone}
          onValueChange={(value) => {
            if (value !== '') setTone(value as (typeof tones)[number])
          }}
        >
          {tones.map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Toggle variant="outline" size="sm" pressed={hasGuide} onPressedChange={setHasGuide}>
          Guide
        </Toggle>
      </div>
      <SampleGroup label="Drawn by a clock">
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
      </SampleGroup>
      <SampleGroup label="Of our own">
        <IconGrid tone={tone}>
          {ownIcons.map(([name, Icon]) => (
            <IconSample key={name} name={name}>
              <IconBox size="size-10" hasGuide={hasGuide}>
                <Icon className="size-full" />
              </IconBox>
              <IconBox size="size-4" hasGuide={hasGuide}>
                <Icon className="size-full" />
              </IconBox>
            </IconSample>
          ))}
        </IconGrid>
      </SampleGroup>
    </SampleCard>
  )
}

/** The grid of samples. It sets the color as the things around a face have it (`data-slot`), so that the icons look here as they do there. */
function IconGrid({ tone, children }: { tone: (typeof tones)[number]; children: ReactNode }) {
  return (
    <ul
      data-slot="act-prop"
      data-tone={tone}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
    >
      {children}
    </ul>
  )
}

/** The box of an icon, with a guide when asked: a dashed square of the area that an icon keeps to (2 units in from the 24 of its frame) and the lines through its middle. */
function IconBox({
  size,
  hasGuide,
  children,
}: {
  size: string
  hasGuide: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('relative', size)}>
      {children}
      {hasGuide && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          <span
            className="absolute border border-dashed border-foreground/40"
            style={{ inset: guideInset }}
          />
          <span className="absolute inset-y-0 left-1/2 border-l border-foreground/20" />
          <span className="absolute inset-x-0 top-1/2 border-t border-foreground/20" />
        </span>
      )}
    </div>
  )
}

/** One icon at two sizes, with its name under it. */
function IconSample({ name, children }: { name: string; children: ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-3">{children}</div>
      <SampleLabel>{name}</SampleLabel>
    </li>
  )
}
