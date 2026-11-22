'use client'

import { type ReactNode, useRef, useState } from 'react'

import { useIsInView } from '@/shared/lib/viewport'

/** How far from the screen a run is when it starts to load, so that it is ready by the time the reader gets to it. */
const nearMargin = '800px'

interface LazyRunProps {
  /** The run is drawn at once: the newest one, which goes on, or all of them when an entry is named by the address. */
  isEager: boolean
  children: ReactNode
}

/**
 * The place of a run in the chat, which draws the run (and so asks for its steps and its reviews)
 * once the reader is near it, and keeps it drawn after that. Until then it holds a place of about
 * the height of a short run.
 */
export function LazyRun({ isEager, children }: LazyRunProps) {
  const place = useRef<HTMLDivElement>(null)
  const isNear = useIsInView(place, { margin: nearMargin, initial: false })
  const [hasBeenNear, setHasBeenNear] = useState(false)

  if (isNear && !hasBeenNear) setHasBeenNear(true)

  const isDrawn = isEager || hasBeenNear
  return (
    <div ref={place} data-slot="lazy-run" className={isDrawn ? undefined : 'min-h-40'}>
      {isDrawn ? children : null}
    </div>
  )
}
