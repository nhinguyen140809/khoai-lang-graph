'use client'

import {
  motion,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'

import { cn } from '@/shared/lib/cn'
import { useIsInView } from '@/shared/lib/viewport'

import type { IconBounds } from '../icon/icon.types'
import { fitOf } from '../icon/icon.utils'
import type { AssetView, DrawnPlate } from './asset.types'

/**
 * The frame of an icon drawn as an asset, as large as the element it is in: the faces of its
 * geometry, farthest first so that the nearer ones cover them, as its clock has drawn them under
 * the view it is seen from. The faces are set on their paths straight from the clock, so that an
 * icon moves with it without a frame of the interface being drawn again. With `bounds`, what the
 * icon draws is scaled and put in the middle so that it takes the same room as the other icons do.
 */
export function AssetFrame({
  className,
  bounds,
  progress,
  view,
  draw,
  animated,
  under,
  over,
}: {
  className?: string | undefined
  bounds: IconBounds
  /** How far the icon's clock has come, from 0 to 1, as a value that changes over time. */
  progress: MotionValue<number>
  /** The angle the icon is seen from. */
  view: AssetView
  /** The faces the icon draws at a point of its clock under a view; the same number of them at every point, whatever the view. */
  draw: (progress: number, view: AssetView) => readonly DrawnPlate[]
  /** Whether the asset itself moves with its clock. A still one is drawn once and only drawn again when the view turns; a moving one also stops while it is out of sight, and goes on from the same point when it comes back. */
  animated?: boolean | undefined
  /** What is drawn behind the faces of the asset, in the room of its frame, given the view: what stands on the far side of it. */
  under?: ((view: AssetView) => ReactNode) | undefined
  /** What is drawn before the faces of the asset, in the room of its frame, given the view: what stands on its near side. */
  over?: ((view: AssetView) => ReactNode) | undefined
}) {
  // The clock the asset is drawn by: the one it is given when it moves with it, held at nothing
  // when it does not, and stopped altogether while it is out of sight.
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useIsInView(ref)
  const held = useMotionValue(progress.get())
  useMotionValueEvent(progress, 'change', (at) => {
    if (isInView) held.set(at)
  })
  useEffect(() => {
    if (isInView) held.set(progress.get())
  }, [isInView, progress, held])
  const still = useMotionValue(0)
  const clock = animated === true ? held : still
  const faces = draw(clock.get(), view)
  // The runs of fill, one name for each wall that carries one, drawn as gradients below.
  const frameId = useId().replace(/:/g, '')
  // A turn of the view, or a new way of drawing, has no point of the clock to ride on, so one is
  // made for it: the paths are drawn again wherever the view goes or the drawing changes, even
  // while the clock stands still.
  const turn = useMotionValue(0)
  useEffect(() => {
    turn.set(turn.get() + 1)
  }, [view.yaw, view.pitch, draw, turn])

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('size-full overflow-visible', className)}
    >
      <defs>
        {faces.map((face, index) =>
          face.spread === undefined ? null : (
            <linearGradient
              key={index}
              id={`${frameId}-${String(index)}`}
              gradientUnits="userSpaceOnUse"
              x1={face.spread.from.x}
              y1={face.spread.from.y}
              x2={face.spread.to.x}
              y2={face.spread.to.y}
            >
              <stop offset="0" stopColor={face.spread.fills[0]} />
              <stop offset="1" stopColor={face.spread.fills[1]} />
            </linearGradient>
          ),
        )}
      </defs>
      <g transform={fitOf(bounds)}>
        {under?.(view)}
        {faces.map((face, index) => (
          <AssetPath
            key={index}
            progress={clock}
            turn={turn}
            view={view}
            draw={draw}
            index={index}
            fillOfPlate={
              face.spread === undefined ? undefined : `url(#${frameId}-${String(index)})`
            }
          />
        ))}
        {over?.(view)}
      </g>
    </svg>
  )
}

/** One face of an icon drawn as an asset: its outline and its fill, straight from the clock that draws it. */
function AssetPath({
  progress,
  turn,
  view,
  draw,
  index,
  fillOfPlate,
}: {
  progress: MotionValue<number>
  turn: MotionValue<number>
  view: AssetView
  draw: (progress: number, view: AssetView) => readonly DrawnPlate[]
  index: number
  /** The fill of the whole face, when it runs from one color to another; the gradient by that name. */
  fillOfPlate?: string | undefined
}): ReactElement {
  const d = useTransform([progress, turn], ([at = 0]: number[]) => draw(at, view)[index]?.d ?? '')
  const fill = useTransform(
    [progress, turn],
    ([at = 0]: number[]) => draw(at, view)[index]?.fill ?? 'none',
  )
  return <motion.path d={d} fill={fillOfPlate ?? fill} fillRule="evenodd" />
}
