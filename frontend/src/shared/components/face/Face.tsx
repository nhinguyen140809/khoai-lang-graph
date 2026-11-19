import { cn } from 'cn'

import { blobMotionClasses, blobShapeClasses, faceSizeClasses } from './face.constants'
import type { Mood } from './face.types'
import type { EyeShape } from './face-look.types'
import { faceOf } from './face-look.utils'
import { blobStyleOf } from './face-style.utils'
import { FaceFeatures } from './FaceFeatures'
import { useFaceParts } from './hooks/useFaceParts'

interface FaceProps {
  /** What the face comes from, such as the key of an agent: the colors and the eyes come from it alone. */
  seed: string
  /** What it is doing or feeling; idle by default. A change of mood is covered by a blink. */
  mood?: Mood
  size?: keyof typeof faceSizeClasses
  /** Forces the shape of the eyes, for a place that shows every one of them. */
  eyes?: EyeShape
  className?: string
}

/**
 * A face: a circle of soft color with two eyes, and with brows for some moods. The color is a pale
 * base with two blobs on it, each blurred, so that the colors melt into one another wherever they
 * meet: a deep color near the center and a second color, larger, from its own place, each in a shape of its own: round,
 * uneven, an ellipse or a streak, turned this way or that. The circle is
 * cut sharp: the base fills it to the edge, and only the blobs are blurred.
 * Everything but the mood comes from the seed, so each agent that the workflow names has a face of
 * its own without anyone drawing it, and the same face wherever it shows. The eyes blink now and
 * then and look about as the mood says; the blobs drift while the face is at work. A change of mood
 * goes gently: the eyes close for an instant, the look of the eyes changes while they are closed,
 * and the brows move to their new shape as the eyes open. The name of the agent sits beside the
 * face, so the face is hidden from assistive technology. It stands still when the user asked for
 * less motion.
 */
export function Face({
  seed,
  mood = 'idle',
  size = 'default',
  eyes: forcedEyes,
  className,
}: FaceProps) {
  const look = faceOf(seed)
  const parts = useFaceParts(look, mood, forcedEyes)
  const drift = blobMotionClasses[parts.moodLook.pace]

  return (
    <span
      aria-hidden
      data-slot="face"
      data-mood={mood}
      className={cn(
        'face-blur relative isolate inline-flex shrink-0 overflow-hidden rounded-full',
        faceSizeClasses[size],
        className,
      )}
      style={blobStyleOf(look)}
    >
      <span
        className={cn('face-blob face-blob-second', blobShapeClasses[look.blobs[1].shape], drift)}
      />
      <span
        className={cn('face-blob face-blob-core', blobShapeClasses[look.blobs[0].shape], drift)}
      />
      <span className="absolute inset-0 noise" />
      <FaceFeatures parts={parts} />
    </span>
  )
}
