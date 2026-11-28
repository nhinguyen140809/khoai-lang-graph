'use client'

import { cn } from 'cn'
import { type HTMLAttributes, type ReactNode } from 'react'

import type { AssetView } from '@/shared/components/animation'
import { Label } from '@/shared/components/ui/label'
import { Slider } from '@/shared/components/ui/slider'
import { Toggle } from '@/shared/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { type IconSpeed, iconSpeeds } from '../../../hooks/useIconClock'
import { SampleLabel } from '../../Sample'

/** The colors that an act may give a thing around the face. */
export const iconTones = ['primary', 'foreground', 'muted'] as const

/** The strokes to try, in units of the 24 by 24 frame of an icon; 1.5 is the default. */
export const iconStrokes = [1, 1.25, 1.5, 2, 2.5] as const

/** How far in from the edge of its frame the area that an icon keeps to starts: 2 units of 24. */
const guideInset = `${String((2 / 24) * 100)}%`

/**
 * The controls over the samples of a card of icons: the clock they are drawn by, and the color of
 * them, the guide over the area they keep to and, where the card shows the icons drawn stroke by
 * stroke, the thickness of the strokes.
 */
export function IconControls({
  isPlaying,
  onPlayingChange,
  speed,
  onSpeedChange,
  tone,
  onToneChange,
  hasGuide,
  onGuideChange,
  stroke,
  onStrokeChange,
}: {
  isPlaying: boolean
  onPlayingChange: (playing: boolean) => void
  speed: IconSpeed
  onSpeedChange: (speed: IconSpeed) => void
  tone: (typeof iconTones)[number]
  onToneChange: (tone: (typeof iconTones)[number]) => void
  hasGuide: boolean
  onGuideChange: (hasGuide: boolean) => void
  /** The thickness of the strokes, for the cards of the icons a clock draws stroke by stroke. */
  stroke?: number | undefined
  onStrokeChange?: ((stroke: number) => void) | undefined
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline" size="sm" pressed={isPlaying} onPressedChange={onPlayingChange}>
        {isPlaying ? 'Playing' : 'Paused'}
      </Toggle>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={speed}
        onValueChange={(value) => {
          if (value !== '') onSpeedChange(value as IconSpeed)
        }}
      >
        {(Object.keys(iconSpeeds) as IconSpeed[]).map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {stroke !== undefined && onStrokeChange !== undefined && (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Stroke"
          value={String(stroke)}
          onValueChange={(value) => {
            if (value !== '') onStrokeChange(Number(value))
          }}
        >
          {iconStrokes.map((value) => (
            <ToggleGroupItem key={value} value={String(value)}>
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="Color"
        value={tone}
        onValueChange={(value) => {
          if (value !== '') onToneChange(value as (typeof iconTones)[number])
        }}
      >
        {iconTones.map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Toggle variant="outline" size="sm" pressed={hasGuide} onPressedChange={onGuideChange}>
        Guide
      </Toggle>
    </div>
  )
}

/** The sliders that turn the view an asset is seen from: its yaw about its vertical axis, and the pitch of the camera over it. */
export function ViewSliders({
  id,
  view,
  onViewChange,
}: {
  /** The first words of the ids of the two sliders, so that each card has ids of its own. */
  id: string
  view: AssetView
  onViewChange: (view: AssetView) => void
}) {
  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center gap-3">
        <Label htmlFor={`${id}-yaw`} className="w-8 shrink-0">
          Yaw
        </Label>
        <Slider
          id={`${id}-yaw`}
          value={[view.yaw]}
          onValueChange={([next]) => {
            onViewChange({ ...view, yaw: next ?? view.yaw })
          }}
          min={-180}
          max={180}
          step={5}
        />
        <SampleLabel className="w-12 shrink-0 text-right">{`${String(view.yaw)} deg`}</SampleLabel>
      </div>
      <div className="flex items-center gap-3">
        <Label htmlFor={`${id}-pitch`} className="w-8 shrink-0">
          Pitch
        </Label>
        <Slider
          id={`${id}-pitch`}
          value={[view.pitch]}
          onValueChange={([next]) => {
            onViewChange({ ...view, pitch: next ?? view.pitch })
          }}
          min={-90}
          max={90}
          step={5}
        />
        <SampleLabel className="w-12 shrink-0 text-right">{`${String(view.pitch)} deg`}</SampleLabel>
      </div>
    </div>
  )
}

/** The grid of samples. It sets the color as the things around a face have it (`data-slot`), so that the icons look here as they do there. */
export function IconGrid({
  tone,
  children,
}: {
  tone: (typeof iconTones)[number]
  children: ReactNode
}) {
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

/**
 * The box of an icon, with a guide when asked: a dashed square of the area that an icon keeps to (2
 * units in from the 24 of its frame) and the lines through its middle. A box that is given the
 * props of a drag turns the view of an asset icon by dragging it, and shows the hand for it.
 */
export function IconBox({
  size,
  hasGuide,
  dragProps,
  children,
}: {
  size: string
  hasGuide: boolean
  /** The props of a drag that turns an asset icon; none for a box that only shows one. */
  dragProps?: HTMLAttributes<HTMLDivElement>
  children: ReactNode
}) {
  return (
    <div
      {...dragProps}
      className={cn(
        'relative',
        size,
        dragProps && 'cursor-grab touch-none select-none active:cursor-grabbing',
      )}
    >
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
export function IconSample({ name, children }: { name: string; children: ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-2 rounded-lg border p-3">
      <div className="flex flex-col items-center gap-3">{children}</div>
      <SampleLabel>{name}</SampleLabel>
    </li>
  )
}
