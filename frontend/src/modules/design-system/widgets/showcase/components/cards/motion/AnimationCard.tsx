'use client'

import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  FolderOpenIcon,
} from 'lucide-react'
import { Fragment, useState } from 'react'

import {
  AnimatedSize,
  CardStack,
  DirectionalSwap,
  Flash,
  Glint,
  Glow,
  type GlowShape,
  Loop,
  LoopStep,
  Presence,
  Reveal,
  Rings,
  Shimmer,
  type SlideDirection,
  type SwapMode,
  type SwapMotion,
  TypedText,
} from '@/shared/components/animation'
import { EmptyState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { Replay } from '../Replay'
import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

const listItems = ['Search mentors', 'Book a session', 'Rate a session', 'Export notes', 'Share']

const presenceVariants = ['fade', 'scale', 'top', 'bottom', 'left', 'right'] as const

const sizeTexts = [
  'Short.',
  'A line that is a little longer than the first one.',
  'A longer text that wraps over two lines, so the box has to grow in width and in height when it comes in.',
]

const moves = [
  { direction: 'up', label: 'Up', Icon: ArrowUpIcon },
  { direction: 'down', label: 'Down', Icon: ArrowDownIcon },
  { direction: 'left', label: 'Left', Icon: ArrowLeftIcon },
  { direction: 'right', label: 'Right', Icon: ArrowRightIcon },
] as const satisfies readonly { direction: SlideDirection; label: string; Icon: unknown }[]

function OptionToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <SampleLabel>{label}</SampleLabel>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        onValueChange={(next) => {
          const chosen = options.find((option) => option === next)
          if (chosen !== undefined) onChange(chosen)
        }}
        aria-label={label}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option}>
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

const motionOptions = ['slide', 'fade'] as const
const modeOptions = ['sync', 'wait'] as const
const distanceOptions = ['25%', '50%', '100%'] as const
const durations = { fast: 150, normal: 300, slow: 800 } as const
const durationOptions = ['fast', 'normal', 'slow'] as const
const flashColors = ['primary', 'success', 'warning', 'destructive'] as const
const shimmerTones = ['neutral', 'primary', 'secondary', 'success', 'warning', 'accent'] as const
// Each shape at a size that fits its box, with the width and the height that the component takes.
const glowShapes = [
  { shape: 'circle', width: '5rem', height: '5rem', rotate: undefined },
  { shape: 'ellipse', width: '9rem', height: '4rem', rotate: -12 },
  { shape: 'streak', width: '12rem', height: '2.5rem', rotate: 8 },
  { shape: 'blob', width: '8rem', height: '5.5rem', rotate: -18 },
] as const satisfies readonly {
  shape: GlowShape
  width: string
  height: string
  rotate: number | undefined
}[]
const distanceOf = { '25%': 0.25, '50%': 0.5, '100%': 1 } as const

function SwapSample({ duration }: { duration: number }) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<SlideDirection>('up')
  const [enter, setEnter] = useState<SwapMotion>('slide')
  const [exit, setExit] = useState<SwapMotion>('slide')
  const [mode, setMode] = useState<SwapMode>('sync')
  const [distance, setDistance] = useState<(typeof distanceOptions)[number]>('50%')

  return (
    <SampleGroup label="DirectionalSwap: press a direction">
      <ButtonGroup>
        {moves.map(({ direction: next, label, Icon }) => (
          <Button
            key={next}
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Move ${label.toLowerCase()}`}
            onClick={() => {
              setDirection(next)
              setStep((current) => current + 1)
            }}
          >
            <Icon />
          </Button>
        ))}
      </ButtonGroup>
      <div className="flex flex-wrap items-center gap-3">
        <OptionToggle label="enter" value={enter} options={motionOptions} onChange={setEnter} />
        <OptionToggle label="exit" value={exit} options={motionOptions} onChange={setExit} />
        <OptionToggle label="mode" value={mode} options={modeOptions} onChange={setMode} />
        <OptionToggle
          label="distance"
          value={distance}
          options={distanceOptions}
          onChange={setDistance}
        />
      </div>
      <DirectionalSwap
        swapKey={step}
        direction={direction}
        enter={enter}
        exit={exit}
        mode={mode}
        duration={duration}
        distance={distanceOf[distance]}
        className="rounded-md"
      >
        <div className="rounded-md border px-3 py-2 text-sm">
          Version {step}
          <SampleLabel className="ml-2">{direction}</SampleLabel>
        </div>
      </DirectionalSwap>
    </SampleGroup>
  )
}

function SizeSample({ duration }: { duration: number }) {
  const [index, setIndex] = useState(0)

  return (
    <SampleGroup label="AnimatedSize: press to change the content">
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="self-start"
        onClick={() => {
          setIndex((current) => (current + 1) % sizeTexts.length)
        }}
      >
        Change content
      </Button>
      {/* The room of the longest text is kept, so the rest of the card stays where it is. */}
      <div className="h-24">
        <AnimatedSize
          className="rounded-md border"
          duration={duration}
          contentClassName="max-w-xs px-3 py-2 text-sm"
        >
          {sizeTexts[index]}
        </AnimatedSize>
      </div>
    </SampleGroup>
  )
}

export function AnimationCard() {
  const [speed, setSpeed] = useState<(typeof durationOptions)[number]>('normal')
  const [flashColor, setFlashColor] = useState<(typeof flashColors)[number]>('success')
  const duration = durations[speed]

  return (
    <SampleCard
      title="Motion"
      description="Components that move content in, out and between states. Samples with a button wait for you; the others play again on their own, or on Replay. All of them stand still when the system asks for less motion."
      className="flex flex-col gap-5"
    >
      <OptionToggle label="duration" value={speed} options={durationOptions} onChange={setSpeed} />
      <SwapSample duration={duration} />
      <SizeSample duration={duration} />
      <SampleGroup label="CollapsibleContent: press to open and close">
        <Collapsible className="h-24">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="xs">
              Toggle details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent duration={duration}>
            <p className="pt-2 text-sm text-muted-foreground">
              The content grows to its own height and shrinks back, and stays in the page until it
              is done.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </SampleGroup>
      <Replay label="Reveal: a list that comes in one item after another">
        {() => (
          <ul className="flex flex-col gap-1">
            {listItems.map((item, index) => (
              <Reveal key={item} asChild index={index} duration={duration}>
                <li className="rounded-md border px-3 py-1.5 text-sm">{item}</li>
              </Reveal>
            ))}
          </ul>
        )}
      </Replay>
      <Replay label="Presence: comes in and goes out, by variant" remount={false} every={2000}>
        {(run) => (
          <div className="grid grid-cols-3 gap-2">
            {presenceVariants.map((variant) => (
              <div
                key={variant}
                className="flex h-14 items-center justify-center rounded-md border border-dashed"
              >
                <Presence
                  present={run % 2 === 0}
                  duration={duration}
                  variant={variant}
                  className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                >
                  {variant}
                </Presence>
              </div>
            ))}
          </div>
        )}
      </Replay>
      <OptionToggle
        label="flash color"
        value={flashColor}
        options={flashColors}
        onChange={setFlashColor}
      />
      <Replay label="Flash: a value that has just changed" remount={false} every={1800}>
        {(run) => (
          <p className="text-sm">
            Open items:{' '}
            {/* A light takes longer to fade than a box takes to move, so it lasts three times as long. */}
            <Flash
              flashKey={run}
              color={flashColor}
              duration={duration * 3}
              className="px-1 font-mono"
            >
              {(run * 7) % 100}
            </Flash>
          </p>
        )}
      </Replay>
      <SampleGroup label="Shimmer: light crosses the text, solid fills it with the tone">
        <div className="grid grid-cols-3 items-center gap-x-6 gap-y-2 text-sm">
          <span />
          <SampleLabel>light</SampleLabel>
          <SampleLabel>solid</SampleLabel>
          {shimmerTones.map((tone) => (
            <Fragment key={tone}>
              <SampleLabel>{tone}</SampleLabel>
              <Shimmer color={tone}>Analysing the transcript</Shimmer>
              <Shimmer color={tone} variant="solid">
                Analysing the transcript
              </Shimmer>
            </Fragment>
          ))}
        </div>
      </SampleGroup>
      <Replay label="TypedText: the words come in one after another, and the line stays centered">
        {() => (
          <p className="text-center text-lg font-semibold">
            <TypedText text="What do you want to build?" />
          </p>
        )}
      </Replay>
      <SampleGroup label="Glint: the star in one color, in a mesh of two colors, and with a color that shifts between two">
        <div className="flex flex-wrap items-center gap-6">
          <Glint aria-hidden color="secondary" />
          <Glint aria-hidden color="secondary" className="size-6" />
          <Glint aria-hidden color="secondary" className="size-10" />
          <Glint aria-hidden variant="mesh" />
          <Glint aria-hidden variant="mesh" className="size-6" />
          <Glint aria-hidden variant="mesh" className="size-10" />
          <Glint aria-hidden variant="shift" />
          <Glint aria-hidden variant="shift" className="size-6" />
          <Glint aria-hidden variant="shift" className="size-10" />
          <Glint
            aria-hidden
            variant="mesh"
            className="size-10"
            colors={['var(--chart-5)', 'var(--chart-2)']}
          />
          <Glint
            aria-hidden
            variant="shift"
            className="size-10"
            colors={['var(--chart-5)', 'var(--chart-3)']}
          />
        </div>
      </SampleGroup>
      <SampleGroup label="Rings: two outlines that turn against each other and change shape; the colors can be given">
        <div className="flex flex-wrap items-center gap-6">
          <Rings aria-hidden size="sm" />
          <Rings aria-hidden />
          <Rings aria-hidden size="lg" />
          <Rings aria-hidden variant="angular" size="sm" />
          <Rings aria-hidden variant="angular" />
          <Rings aria-hidden variant="angular" size="lg" />
          <Rings aria-hidden size="lg" colors={['var(--chart-1)', 'var(--chart-5)']} />
          <Rings
            aria-hidden
            variant="angular"
            size="lg"
            colors={['var(--chart-3)', 'var(--chart-2)']}
          />
        </div>
      </SampleGroup>
      <SampleGroup label="Glow: the shapes, each in a color of the interface; a blob or a streak can lean">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {glowShapes.map(({ shape, width, height, rotate }, index) => (
            <div
              key={shape}
              className="relative isolate flex h-32 items-end overflow-hidden rounded-md border p-2"
            >
              <Glow
                shape={shape}
                blur="sm"
                width={width}
                height={height}
                color={index % 2 === 0 ? 'primary' : 'secondary'}
                strength={60}
                rotate={rotate}
                entrance="grow"
                className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
              />
              <SampleLabel>
                {shape}
                {rotate === undefined ? '' : `, ${String(rotate)} deg`}
              </SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="CardStack: cards in a pile; the front one grows and fades away, the others come forward">
        <CardStack
          items={[
            {
              label: 'Interviews',
              render: () => <p className="p-3 text-sm">Plan the interviews</p>,
            },
            {
              label: 'Personas',
              render: () => <p className="p-3 text-sm">Propose the personas</p>,
            },
            { label: 'Backlog', render: () => <p className="p-3 text-sm">Write the backlog</p> },
          ]}
        />
      </SampleGroup>
      <SampleGroup label="Loop and LoopStep: the parts of a drawing come in one after the other, stay, and go together at the end of the cycle">
        <svg viewBox="0 0 120 32" className="h-10 text-primary" fill="currentColor" aria-hidden>
          <Loop isPlaying>
            <LoopStep at={0}>
              <circle cx="16" cy="16" r="8" />
            </LoopStep>
            <LoopStep at={0.2}>
              <circle cx="60" cy="16" r="8" />
            </LoopStep>
            <LoopStep at={0.4}>
              <circle cx="104" cy="16" r="8" />
            </LoopStep>
          </Loop>
        </svg>
      </SampleGroup>
      <SampleGroup label="Breathe: the stage at work fades down and back in place, where Shimmer travels over the text">
        <p className="animate-breathe text-sm motion-reduce:animate-none">
          Writing the specification
        </p>
      </SampleGroup>
      <SampleGroup label="EmptyState in the page size, with the glow of its place">
        <div className="h-56 rounded-md border">
          <EmptyState
            title="No documents yet"
            description="The documents of the project show here once the agents have written them."
            icon={FolderOpenIcon}
          />
        </div>
      </SampleGroup>
      <SampleGroup label="Already in motion">
        <p className="text-sm text-muted-foreground">
          Sheet, Drawer, Dialog, popovers and menus slide or fade in and out; try them in Overlays.
          The collapsing sidebar moves its width, and so do the side and bottom panels of the
          workspace when they are hidden or shown; dragging them follows the pointer at once.
        </p>
      </SampleGroup>
    </SampleCard>
  )
}
