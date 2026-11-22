import { cn } from 'cn'
import { motion } from 'motion/react'
import type { CSSProperties } from 'react'

import {
  blobShapeClasses,
  faceLayerCount,
  faceSilhouetteClasses,
  faceSizeClasses,
} from './face.constants'
import type { FaceProps } from './face.types'
import { FaceFeatures } from './FaceFeatures'
import { useFace } from './hooks/useFace'
import { blobStyleOf } from './look/face-style.utils'
import { blobMotionClasses } from './motion/face-motion.constants'

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
  const { look, ref, isInView, isRested, parts, gaze, poseStyle, bodyStyle } = useFace({
    seed,
    mood,
    drive,
  })
  const drift = blobMotionClasses[parts.moodLook.pace]

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
