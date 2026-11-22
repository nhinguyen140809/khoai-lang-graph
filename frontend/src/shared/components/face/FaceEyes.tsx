import { cn } from 'cn'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { eyeGeometries } from './face.constants'
import type { EyeKind, EyeLife, Gaze, GazeValues } from './face.types'
import { delayOf } from './look/face-style.utils'
import { eyeLifeLooks, gazeLooks } from './motion/face-motion.constants'

/** A pill of an eye standing up: its corners are as round as its narrow side. */
function longEye(cx: number, scale: number, line: number): ReactNode {
  const { halfWidth, halfHeight } = eyeGeometries.long
  return (
    <rect
      x={cx - halfWidth * scale}
      y={line - halfHeight * scale}
      width={2 * halfWidth * scale}
      height={2 * halfHeight * scale}
      rx={halfWidth * scale}
    />
  )
}

/** An oval eye, taller than it is wide or wider than it is tall by its kind. */
function ovalEye(kind: 'tall' | 'flat'): (cx: number, scale: number, line: number) => ReactNode {
  const { halfWidth, halfHeight } = eyeGeometries[kind]
  return (cx, scale, line) => (
    <ellipse cx={cx} cy={line} rx={halfWidth * scale} ry={halfHeight * scale} />
  )
}

/** A closed eye, as a line that curves up (smiling) or down (shut): the one is the other turned over. */
function curvedEye(kind: 'arc' | 'shut'): (cx: number, scale: number, line: number) => ReactNode {
  const { halfWidth, halfHeight } = eyeGeometries[kind]
  const sign = kind === 'arc' ? -1 : 1
  return (cx, scale, line) => {
    const width = halfWidth * scale
    return (
      <path
        d={`M${String(cx - width)} ${String(line - sign * halfHeight)}q${String(width)} ${String(sign * halfHeight * 2.8)} ${String(2 * width)} 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    )
  }
}

// The white of an eye by its kind, at a center of the line of the eyes and as large as `scale`
// says. All of it is worked out from the geometry of the kind, so a new kind needs its geometry
// and a drawer, and nothing else knows its size.
const eyeDrawers: Record<EyeKind, (cx: number, scale: number, line: number) => ReactNode> = {
  long: longEye,
  round: (cx, scale, line) => (
    <circle cx={cx} cy={line} r={eyeGeometries.round.halfWidth * scale} />
  ),
  tall: ovalEye('tall'),
  flat: ovalEye('flat'),
  arc: curvedEye('arc'),
  shut: curvedEye('shut'),
}

interface EyeProps {
  kind: EyeKind
  /** The center of the eye, and the height of the line of the eyes, in the units of the face. */
  cx: number
  line: number
  scale: number
  /** How far the eye leans at rest, in degrees. */
  tilt: number
  life: EyeLife
  gaze: Gaze
  gazeValues: GazeValues['eye']
}

/**
 * One eye, in three layers that do not share a property: the first holds it where its gaze rests,
 * the second moves it and leans it toward where it looks, around its own center (the gaze moves
 * it, see `useGaze`), and the third is what the eye does by itself, and the lean at rest.
 */
function Eye({ kind, cx, line, scale, tilt, life, gaze, gazeValues }: EyeProps) {
  const lifeLook = eyeLifeLooks[life]
  const { x, y }: { x: number; y: number } = gazeLooks[gaze].rest
  return (
    <g transform={`translate(${String(x)} ${String(y)})`}>
      <motion.g
        style={{
          x: gazeValues.x,
          y: gazeValues.y,
          rotate: gazeValues.roll,
          transformBox: 'fill-box',
          transformOrigin: 'center',
        }}
      >
        <g
          className={lifeLook.className}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            rotate: `${String(tilt)}deg`,
            ...delayOf(lifeLook.durationToken),
          }}
        >
          {eyeDrawers[kind](cx, scale, line)}
        </g>
      </motion.g>
    </g>
  )
}

interface FaceEyesProps {
  /** The kind of the left and of the right eye. */
  kinds: readonly [EyeKind, EyeKind]
  /** The centers of the left and the right eye. */
  centers: readonly [number, number]
  scales: readonly [number, number]
  /** The height of the line of the eyes, in the units of the face. */
  line: number
  /** How far each eye leans at rest, in degrees. */
  tilts: readonly [number, number]
  /** What each eye does by itself. */
  lives: readonly [EyeLife, EyeLife]
  gaze: Gaze
  /** What moves the eyes with the gaze, over time. */
  gazeValues: GazeValues['eye']
  /** The look of the eyes is about to change, so they are closed. */
  isChanging: boolean
  /** The eyes are blinking now. */
  isBlinking: boolean
  /** The eyes have closed, and the look may change. */
  onClosed: () => void
}

/**
 * The two eyes, in layers that do not share a property: one closes the eyes while a mood changes,
 * one blinks them, and each eye has its own layers (see `Eye`).
 */
export function FaceEyes({
  kinds,
  centers,
  scales,
  line,
  tilts,
  lives,
  gaze,
  gazeValues,
  isChanging,
  isBlinking,
  onClosed,
}: FaceEyesProps) {
  return (
    <g
      className={cn('face-squash', isChanging && 'scale-y-10 face-squash-closing')}
      style={{ transformBox: 'view-box', transformOrigin: 'center' }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && isChanging) onClosed()
      }}
    >
      <g
        className={cn(isBlinking && 'animate-face-blink motion-reduce:animate-none')}
        style={{ transformBox: 'view-box', transformOrigin: 'center' }}
      >
        {centers.map((cx, index) => (
          <Eye
            key={index === 0 ? 'left' : 'right'}
            kind={kinds[index] ?? 'long'}
            cx={cx}
            line={line}
            scale={scales[index] ?? 1}
            tilt={tilts[index] ?? 0}
            life={lives[index] ?? 'steady'}
            gaze={gaze}
            gazeValues={gazeValues}
          />
        ))}
      </g>
    </g>
  )
}
