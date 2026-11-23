'use client'

import { cn } from 'cn'
import * as React from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useElementSize } from '@/shared/lib/animation'
import { type Tone, toneClasses } from '@/shared/lib/tone'

/** How the segments are drawn: apart, each with a tooltip of its own, or in one line with one tooltip. */
type SegmentedProgressLayout = 'segments' | 'continuous'

const LayoutContext = React.createContext<SegmentedProgressLayout>('segments')

/** The narrowest that a segment may be drawn apart, in pixels; narrower, the bar is one line. */
const minSegmentWidth = 20

interface SegmentedProgressProps extends React.ComponentProps<'div'> {
  /** What a screen reader says of the whole bar, such as "Progress". */
  label: string
  /**
   * What the one tooltip of the bar names while it is one line, such as the step the work is at.
   * The segments say their own name only while they are apart.
   */
  currentLabel?: string | undefined
}

/**
 * A bar of thin segments, one for each step of some work, which a `SegmentedProgressItem` each
 * draws. The bar keeps no state: the owner gives each segment its color. It follows its own
 * width, which the place around it sets: while each segment has room it draws them apart, each
 * naming itself on hover; when the place is too narrow for that it draws them as one line of the
 * same thickness, the colors side by side with no gap, and names only `currentLabel` on hover.
 * Size it with the class: its height is the area that a pointer hits, and the line sits in the
 * middle of it.
 */
function SegmentedProgress({
  label,
  currentLabel,
  className,
  children,
  ...props
}: SegmentedProgressProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const count = React.Children.count(children)
  const isContinuous = size !== null && count > 0 && size.width / count < minSegmentWidth
  const layout: SegmentedProgressLayout = isContinuous ? 'continuous' : 'segments'

  const bar = (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-slot="segmented-progress"
      data-layout={layout}
      className={cn('flex items-center gap-1 data-[layout=continuous]:gap-0', className)}
      {...props}
    >
      <LayoutContext value={layout}>{children}</LayoutContext>
    </div>
  )
  if (currentLabel === undefined) return bar

  // The wrapper stays while the segments are apart, closed, so that the bar is not made again when
  // the layout changes; the segments have tooltips of their own then.
  return (
    <Tooltip {...(!isContinuous && { open: false })}>
      <TooltipTrigger asChild>{bar}</TooltipTrigger>
      <TooltipContent>{currentLabel}</TooltipContent>
    </Tooltip>
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

/** One segment of a `SegmentedProgress`: a thin line in its tone, with a taller hit area; apart, it has a tooltip. */
function SegmentedProgressItem({
  label,
  tone = 'neutral',
  isQuiet = false,
  isLive = false,
}: SegmentedProgressItemProps) {
  const layout = React.use(LayoutContext)
  const line = (
    <span
      aria-hidden
      data-quiet={isQuiet}
      data-live={isLive}
      className={cn(
        'h-1.5 w-full rounded-full bg-(--tone) transition-colors data-[live=true]:animate-breathe data-[quiet=true]:bg-foreground/25 motion-reduce:animate-none motion-reduce:transition-none',
        // In one line only the two ends are round, so that the segments join with no gap.
        layout === 'continuous' &&
          'rounded-none group-first/segment:rounded-l-full group-last/segment:rounded-r-full',
        toneClasses[tone],
      )}
    />
  )
  const item = (
    <span
      data-slot="segmented-progress-item"
      className="group/segment flex h-full min-w-0 flex-1 items-center"
    >
      {line}
      <span className="sr-only">{label}</span>
    </span>
  )
  if (layout === 'continuous') return item

  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { SegmentedProgress, SegmentedProgressItem }
