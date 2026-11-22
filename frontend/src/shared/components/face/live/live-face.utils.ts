import { eyeGeometries, faceUnits, shapeEyeLines } from '../face.constants'
import type { EyeKind, MoodLook } from '../face.types'
import { eyeCentersOf } from '../face.utils'
import type { FaceLook } from '../look/face-look.types'
import { liveEaseSeconds, liveUnit } from './live-face.constants'
import type { LiveValues } from './live-face.types'

/** How much of an eye of a kind is drawn as an open oval, as a smiling line and as a shut one. */
function formOf(kind: EyeKind): Pick<LiveValues, 'eyeLeftOpen' | 'eyeLeftArc' | 'eyeLeftShut'> {
  return {
    eyeLeftOpen: kind === 'arc' || kind === 'shut' ? 0 : 1,
    eyeLeftArc: kind === 'arc' ? 1 : 0,
    eyeLeftShut: kind === 'shut' ? 1 : 0,
  }
}

/** The size of the outline in the file, in pixels, centered in an artboard of 320: the places of the blobs are shares of it. */
const outlineSize = 260
const outlineStart = (320 - outlineSize) / 2

/** A place of a blob, from its share of the face in percent to pixels of the artboard of the file. */
function blobPixelOf(percent: number): number {
  return outlineStart + (percent / 100) * outlineSize
}

/**
 * What a look and the look of a mood make of a face in the terms of the animation file: the outline,
 * where the blobs sit, how far apart the eyes are and the size and lean of each. The same tables
 * decide it as the ones that draw a face in CSS, so a new mood or a new face is added in one place.
 * A user who asked for less motion has changes land at once.
 */
export function liveValuesOf(look: FaceLook, moodLook: MoodLook, isStill: boolean): LiveValues {
  const [left, right] = moodLook.eyes
  const [leftScale, rightScale] = moodLook.eyeScales
  const [leftCenter, rightCenter] = eyeCentersOf(moodLook.eyes, look.gap, moodLook.eyeScales)
  const [core, second] = look.spots
  const middle = (leftCenter + rightCenter) / 2
  return {
    silhouette: look.shape,
    eyeGap: ((rightCenter - leftCenter) / 2) * liveUnit,
    eyeLine: shapeEyeLines[look.shape] - faceUnits / 2,
    eyeShift: middle - faceUnits / 2,
    coreX: blobPixelOf(core.x),
    coreY: blobPixelOf(core.y),
    secondX: blobPixelOf(second.x),
    secondY: blobPixelOf(second.y),
    eyeLeftWidth: 2 * eyeGeometries[left].halfWidth * leftScale * liveUnit,
    eyeLeftHeight: 2 * eyeGeometries[left].halfHeight * leftScale * liveUnit,
    eyeLeftTilt: moodLook.tilts[0],
    eyeRightWidth: 2 * eyeGeometries[right].halfWidth * rightScale * liveUnit,
    eyeRightHeight: 2 * eyeGeometries[right].halfHeight * rightScale * liveUnit,
    eyeRightTilt: moodLook.tilts[1],
    ...formOf(left),
    eyeRightOpen: formOf(right).eyeLeftOpen,
    eyeRightArc: formOf(right).eyeLeftArc,
    eyeRightShut: formOf(right).eyeLeftShut,
    motionSeconds: isStill ? 0 : liveEaseSeconds,
  }
}
