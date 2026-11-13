import { cn } from 'cn'
import * as React from 'react'

interface SegmentedBarProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The value to show, on the scale from `min` to `max`. */
  value: number
  /** The lowest value of the scale; 1 by default. */
  min?: number
  /** The highest value of the scale; 5 by default. */
  max?: number
  /** What a screen reader says of the value, such as "High, 4 of 5". */
  label: string
}

/** A value on a small scale, drawn as a bar of one segment for each step, as many of them filled as the value says. */
function SegmentedBar({ value, min = 1, max = 5, label, className, ...props }: SegmentedBarProps) {
  const steps = Math.max(max - min + 1, 1)
  const filled = Math.min(Math.max(value - min + 1, 0), steps)
  return (
    <div
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, min), max)}
      aria-valuetext={label}
      aria-label={label}
      data-slot="segmented-bar"
      className={cn('flex w-full items-center gap-1.5', className)}
      {...props}
    >
      {Array.from({ length: steps }, (_, index) => (
        <span
          key={index}
          aria-hidden
          data-filled={index < filled}
          className="h-2 flex-1 rounded-full bg-muted data-[filled=true]:bg-primary"
        />
      ))}
    </div>
  )
}

export { SegmentedBar }
