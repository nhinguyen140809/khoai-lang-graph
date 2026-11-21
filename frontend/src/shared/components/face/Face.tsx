import { cn } from 'cn'
import { motion } from 'motion/react'
import { type CSSProperties, useRef } from 'react'

import { useIsInView } from '@/shared/lib/viewport'

import {
  blobShapeClasses,
  faceLayerCount,
  faceSilhouetteClasses,
  faceSizeClasses,
  shapeEyeReachShares,
} from './face.constants'
import type { FaceDrive, FaceState, Mood } from './face.types'
import { isRestingMood } from './face.utils'
import { FaceFeatures } from './FaceFeatures'
import { useFaceParts } from './hooks/useFaceParts'
import { useFaceRules } from './hooks/useFaceRules'
import { faceOf } from './look/face-look.utils'
import { blobStyleOf } from './look/face-style.utils'
import { restAfterMs, restingStates } from './mood/face-mood.constants'
import { useRested } from './mood/hooks/useRested'
import { blobMotionClasses, gazeLooks } from './motion/face-motion.constants'
import { useFaceMotion } from './motion/hooks/useFaceMotion'
import { useGaze } from './motion/hooks/useGaze'

interface FaceProps {
  /** What the face comes from, such as the key of an agent: its outline and its colors come from it alone. */
  seed: string
  /** What it is doing or feeling; idle by default. A change of mood is covered by a blink. */
  mood?: Mood
  /** What steers the look and the move of the face from outside, such as the acts around it; the mood stays its own. */
  drive?: FaceDrive
  size?: keyof typeof faceSizeClasses
  className?: string
}

/**
 * A face: a shape of soft color (a circle, a ghost, a drop...) with two long eyes. The color is a pale
 * base with two blobs on it, each blurred, so that the colors melt into one another wherever they
 * meet: a deep color near the center and a second color, larger, from its own place, each in a shape of its own: round,
 * uneven, an ellipse or a streak, turned this way or that. The circle is
 * cut sharp: the base fills the shape to its edge, and only the blobs are blurred.
 * Everything but the mood comes from the seed, so each agent that the workflow names has a face of
 * its own without anyone drawing it, and the same face wherever it shows. The eyes blink now and
 * then and look about as the mood says, each leaning toward where it looks; the blobs drift while
 * the face is at work. A face that is idle or happy for long comes to rest: an idle one looks to one side and keeps
 * still, and a happy one stops swaying; only an eye that can blink blinks. A face out of sight stops all of its motion and goes on from the
 * same point when it comes back. A change of mood goes gently: the eyes close for an instant, and the look
 * of the eyes changes while they are closed. The name of the agent sits beside the
 * face, so the face is hidden from assistive technology. It stands still when the user asked for
 * less motion.
 */
export function Face({ seed, mood = 'idle', drive, size = 'default', className }: FaceProps) {
  const look = faceOf(seed, useFaceRules())
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useIsInView(ref)
  const restingMood = isRestingMood(mood) ? mood : null
  const isRested = useRested(restingMood, restAfterMs)
  const state: FaceState = isRested && restingMood !== null ? restingStates[restingMood] : mood
  const parts = useFaceParts(look, state)
  const drift = blobMotionClasses[parts.moodLook.pace]
  const gazeLook = gazeLooks[parts.moodLook.gaze]
  const timing = {
    phase: look.phase,
    isChanging: parts.isChanging,
    isRunning: isInView,
    reachShare: shapeEyeReachShares[look.shape],
  }
  const gaze = useGaze(gazeLook, timing, drive?.look)
  const { poseStyle, bodyStyle } = useFaceMotion(parts.moodLook, gaze.head, timing, drive?.move)

  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="face"
      data-mood={mood}
      data-resting={isRested || undefined}
      className={cn(
        'relative inline-flex shrink-0 face-stage',
        !isInView && 'face-paused',
        faceSizeClasses[size],
        className,
      )}
      style={{ ...blobStyleOf(look), '--face-layers': faceLayerCount } as CSSProperties}
    >
      <motion.span className="face-pose" style={poseStyle}>
        <motion.span data-body={parts.moodLook.body} className="face-body" style={bodyStyle}>
          {Array.from({ length: faceLayerCount }, (_, layer) => (
            <span
              key={layer}
              className={cn('face-layer', faceSilhouetteClasses[look.shape])}
              style={{ '--layer': layer + 1 } as CSSProperties}
            />
          ))}
          <span
            className={cn(
              'face-blur relative isolate block size-full overflow-hidden',
              faceSilhouetteClasses[look.shape],
            )}
          >
            <span
              className={cn(
                'face-blob face-blob-second',
                blobShapeClasses[look.blobs[1].shape],
                drift,
              )}
            />
            <span
              className={cn(
                'face-blob face-blob-core',
                blobShapeClasses[look.blobs[0].shape],
                drift,
              )}
            />
            <span className="absolute inset-0 noise" />
            <FaceFeatures parts={parts} gaze={gaze} />
          </span>
        </motion.span>
      </motion.span>
    </span>
  )
}
