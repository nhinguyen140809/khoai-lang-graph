'use client'

import { cn } from 'cn'
import * as React from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { type Tone, toneClasses } from '@/shared/lib/tone'

interface SegmentedProgressProps extends React.ComponentProps<'div'> {
  /** What a screen reader says of the whole bar, such as "Progress". */
  label: string
}

/**
 * A bar of thin segments, one for each step of some work, which a `SegmentedProgressItem` each
 * draws. The bar keeps no state: the owner gives each segment its color. Size it with the class:
 * its height is the area that a pointer hits, and the line sits in the middle of it.
 */
function SegmentedProgress({ label, className, ...props }: SegmentedProgressProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="segmented-progress"
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  )
}

interface SegmentedProgressItemProps {
  /** What the segment is, read by assistive technology and shown in its tooltip on hover. */
  label: string
  /** The color of the segment; neutral by default. */
  tone?: Tone
  /** The segment shows as a quiet track, for a step that has not begun. */
  isQuiet?: boolean
  /** The segment breathes, for a step that is not over: running, or waiting for the user. */
  isLive?: boolean
}

/** One segment of a `SegmentedProgress`: a thin line in its tone, with a taller hit area and a tooltip. */
function SegmentedProgressItem({
  label,
  tone = 'neutral',
  isQuiet = false,
  isLive = false,
}: SegmentedProgressItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-slot="segmented-progress-item"
          className="flex h-full min-w-0 flex-1 items-center"
        >
          <span
            aria-hidden
            data-quiet={isQuiet}
            data-live={isLive}
            className={cn(
              'h-1.5 w-full rounded-full bg-(--tone) transition-colors data-[live=true]:animate-breathe data-[quiet=true]:bg-foreground/25 motion-reduce:animate-none motion-reduce:transition-none',
              toneClasses[tone],
            )}
          />
          <span className="sr-only">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { SegmentedProgress, SegmentedProgressItem }
