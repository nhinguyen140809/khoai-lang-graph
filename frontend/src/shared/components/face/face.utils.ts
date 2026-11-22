import { eyeGeometries, eyeSpacing, faceUnits } from './face.constants'
import type { EyeKind, Mood, RestingMood } from './face.types'
import type { EyeGap } from './look/face-look.types'
import { restingStates } from './mood/face-mood.constants'

/**
 * The centers of the left and the right eye. The space between the eyes is the same share of the
 * face whatever the size of the face, and the eyes are as wide apart as their own widths need, so
 * wide eyes never touch and a small face has the same look as a large one. Two eyes of different
 * kinds or sizes sit side by side in the middle of the face.
 */
export function eyeCentersOf(
  kinds: readonly [EyeKind, EyeKind],
  gap: EyeGap,
  scales: readonly [number, number] = [1, 1],
): readonly [number, number] {
  const left = 2 * eyeGeometries[kinds[0]].halfWidth * scales[0]
  const right = 2 * eyeGeometries[kinds[1]].halfWidth * scales[1]
  const start = (faceUnits - (left + right + eyeSpacing[gap])) / 2
  return [start + left / 2, start + left + eyeSpacing[gap] + right / 2]
}

/** Whether a face in this mood comes to rest when it has nothing to do. */
export function isRestingMood(mood: Mood): mood is RestingMood {
  return mood in restingStates
}

/** Whether eyes of a kind blink: closed eyes do not. */
export function canBlink(kind: EyeKind): boolean {
  return kind !== 'arc' && kind !== 'shut' && kind !== 'cross' && kind !== 'spiral'
}
