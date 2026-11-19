import { cn } from 'cn'
import type { ReactNode } from 'react'

import { eyeGeometries, eyeLine, gazeLooks } from './face.constants'
import type { EyeKind, Gaze } from './face.types'
import { delayOf } from './face-style.utils'

/** A pill of a kind of eye, standing up or lying down by its geometry: its corners are as round as its narrow side. */
function pillOf(kind: 'long' | 'slim'): (cx: number, scale: number) => ReactNode {
  const { halfWidth, halfHeight } = eyeGeometries[kind]
  return (cx, scale) => (
    <rect
      x={cx - halfWidth * scale}
      y={eyeLine - halfHeight * scale}
      width={2 * halfWidth * scale}
      height={2 * halfHeight * scale}
      rx={Math.min(halfWidth, halfHeight) * scale}
    />
  )
}

// The white of an eye by its kind, at a center of the line of the eyes and as large as `scale`
// says. All of it is worked out from the geometry of the kind, so a new kind needs its geometry
// and a drawer, and nothing else knows its size.
const eyeDrawers: Record<EyeKind, (cx: number, scale: number) => ReactNode> = {
  round: (cx, scale) => <circle cx={cx} cy={eyeLine} r={eyeGeometries.round.halfWidth * scale} />,
  long: pillOf('long'),
  slim: pillOf('slim'),
  // A closed eye smiling: an arc, as a line.
  arc: (cx, scale) => {
    const { halfWidth, halfHeight } = eyeGeometries.arc
    const width = halfWidth * scale
    return (
      <path
        d={`M${String(cx - width)} ${String(eyeLine + halfHeight)}q${String(width)}-${String(halfHeight * 2.8)} ${String(2 * width)} 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    )
  },
  // A half closed eye: the lower half of a disc.
  lid: (cx, scale) => {
    const width = eyeGeometries.lid.halfWidth * scale
    return (
      <path
        d={`M${String(cx - width)} ${String(eyeLine - eyeGeometries.lid.halfHeight)}h${String(2 * width)}a${String(width)} ${String(width)} 0 0 1-${String(2 * width)} 0z`}
      />
    )
  },
}

/** Whether eyes of a kind blink: closed and half closed eyes do not. */
export function canBlink(kind: EyeKind): boolean {
  return kind !== 'arc' && kind !== 'lid'
}

interface FaceEyesProps {
  kind: EyeKind
  /** The centers of the left and the right eye. */
  centers: readonly [number, number]
  scale: number
  gaze: Gaze
  /** The look of the eyes is about to change, so they are closed. */
  isChanging: boolean
  /** The eyes have closed, and the look may change. */
  onClosed: () => void
}

/**
 * The two eyes, in three layers that move apart: one that closes the eyes while a mood changes, one
 * that blinks them, and one that looks about. The layers do not share a property, so each does its own.
 */
export function FaceEyes({ kind, centers, scale, gaze, isChanging, onClosed }: FaceEyesProps) {
  const gazeLook = gazeLooks[gaze]
  const { x, y }: { x: number; y: number } = gazeLook.rest
  const canBlinkNow = canBlink(kind) && !isChanging
  return (
    <g
      className={cn('face-squash', isChanging && 'scale-y-10')}
      style={{ transformBox: 'view-box', transformOrigin: 'center' }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && isChanging) onClosed()
      }}
    >
      <g
        className={cn(canBlinkNow && 'animate-face-blink motion-reduce:animate-none')}
        style={{
          transformBox: 'view-box',
          transformOrigin: 'center',
          ...(canBlink(kind) && delayOf('--duration-face-blink')),
        }}
      >
        <g
          className={gazeLook.className}
          {...((x !== 0 || y !== 0) && { transform: `translate(${String(x)} ${String(y)})` })}
          style={{
            transformBox: 'view-box',
            transformOrigin: 'center',
            ...delayOf(gazeLook.durationToken),
          }}
        >
          {centers.map((cx) => (
            <g key={cx}>{eyeDrawers[kind](cx, scale)}</g>
          ))}
        </g>
      </g>
    </g>
  )
}
