'use client'

import { cn } from 'cn'
import { Progress as ProgressPrimitive } from 'radix-ui'
import * as React from 'react'

import { type Tone, toneClasses } from '@/lib/tone.constants'

function Progress({
  className,
  value,
  color = 'primary',
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, 'color'> & { color?: Tone }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-color={color}
      className={cn(
        'relative flex h-1 w-full items-center overflow-x-hidden rounded-md bg-muted',
        toneClasses[color],
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-(--tone-strong) transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
