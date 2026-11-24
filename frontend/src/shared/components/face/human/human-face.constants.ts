import definition from '@dicebear/styles/lorelei.json' with { type: 'json' }

import type { FaceLooks } from '../face.types'
import catalog from './faces.catalog.json' with { type: 'json' }
import type { EyeStep, FaceCatalog, HumanMoodLook } from './human-face.types'

/** The catalog of the faces of people: every part, variant and token that a face may name. */
export const faceCatalog: FaceCatalog = catalog

/** The art of the plain look: the definition that draws a face from the ids of the variants. */
export const faceArt = definition

/** The palette of black lines on white: a face is drawn in it only when it asks for it by name. */
export const monochromePalette = 'ink'

/**
 * The part of the picture that the face shows, as the corner and the side of a square in the units
 * of the art: the head and the hair, close up, without the shoulders below.
 */
export const faceCrop = '0 0 980 980'

/** How many units of the art an iris moves for a unit of a gaze: the irises move in their lids, which are about a hundred units wide, so a gaze moves them a little. */
export const gazeUnit = 8

/** How much of every gaze the face of a person takes, as a multiple of the one of an agent: its eyes are drawn, so they move as a picture does, and less is more. */
export const humanGazeScale = 0.5

/** How much of the moves of the body of a mood the face of a person makes: a face in a circle that jumped as far as an agent does would leave it. */
export const humanBodyScale = 0.25

/** Where the art of the eyes splits the left eye from the right one, in the units of the eye part: the eyes of a variant lie each on one side of it, so that each eye is drawn from a variant of its own. */
export const eyesMidline = 185

/** Where the middle of each eye lies across, in the units of the eye part, which a motion of an eye of its own turns about. */
export const eyeCenters = { left: 110, right: 295 } as const

/** The height of the middle of an eye in the units of the eye part: an eye drawn upside down turns about it. */
export const eyesMiddleY = 60

/** How long the eyes take to close when a mood changes, in milliseconds: the time of the transition in the style sheet of the face, and a little over. */
export const eyesCloseMs = 130

/** How far an eye looks up or down in its lid, in the units of a gaze (see `gazeUnit`): the iris moves there, and the lid stays. */
export const humanLookOffsets = {
  up: { x: 0, y: -1.4 },
  down: { x: 0, y: 1.3 },
} as const

/** How long a step of the eyes lasts when the eyes have only one, so that they stay as they are: an hour. */
const restMs = 3_600_000

/** The eyes that no family has, and the motion that each has of its own, in place of a change of eyes. */
export const humanSoloMotions: Readonly<Record<string, 'pulse'>> = {
  hearts: 'pulse',
}

/** The rounds of steps of the eyes of the moods that go the same for both eyes. */
const idleEyes: readonly EyeStep[] = [{ role: 'rest', ms: restMs }]

const thinkingEyes: readonly EyeStep[] = [
  { role: 'rest', ms: 1800 },
  { role: 'open', ms: 1900, look: 'up' },
  { role: 'rest', ms: 1300, look: 'up' },
  { role: 'open', ms: 1700, look: 'down' },
  { role: 'rest', ms: 1200, look: 'down' },
]

const workingEyes: readonly EyeStep[] = [
  { role: 'rest', ms: 2400 },
  { role: 'open', ms: 1800 },
]

const waitingEyes: readonly EyeStep[] = [
  { role: 'rest', ms: 3200 },
  { role: 'open', ms: 1400 },
]

const worriedEyes: readonly EyeStep[] = [
  { role: 'wide', ms: 2800 },
  { role: 'rest', ms: 1400 },
]

const surprisedEyes: readonly EyeStep[] = [{ role: 'wide', ms: restMs }]

const sleepingEyes: readonly EyeStep[] = [{ role: 'shut', ms: restMs }]
/**
 * What each mood does to the face of a person: where the eyes look, how the head and the body
 * move, what the eyes go through, and what the mouth is drawn as. The head sways while it thinks
 * and works, tilts when worried; the body breathes at rest, bounces when glad and pulses when
 * surprised. The eyes go through a round of looks, each a kind of eye of the family of the eyes of
 * the face (`rest` is the eyes as the face has them) and, for some, a look up or down in the lid,
 * and each eye goes its own way: a glad face winks. The mouth is the one of the face unless the
 * mood asks for another. The other states take the look of their mood.
 */
export const humanLooks: FaceLooks<HumanMoodLook> = {
  idle: {
    gaze: 'drift',
    body: 'breathe',
    eyes: { left: idleEyes, right: idleEyes },
    mouth: null,
  },
  thinking: {
    gaze: 'ponder',
    pose: 'sway',
    eyes: { left: thinkingEyes, right: thinkingEyes },
    mouth: null,
  },
  working: {
    gaze: 'scan',
    pose: 'sway',
    eyes: { left: workingEyes, right: workingEyes },
    mouth: null,
  },
  waiting: {
    gaze: 'glance',
    eyes: { left: waitingEyes, right: waitingEyes },
    mouth: null,
  },
  happy: {
    gaze: 'still',
    body: 'bounce',
    eyes: {
      left: [
        { role: 'smile', ms: 4200 },
        { role: 'rest', ms: 1400 },
      ],
      right: [
        { role: 'smile', ms: 3000 },
        { role: 'shut', ms: 450 },
        { role: 'smile', ms: 750 },
        { role: 'rest', ms: 1400 },
      ],
    },
    mouth: 'open-smile',
  },
  worried: {
    gaze: 'down',
    pose: 'tilt',
    eyes: { left: worriedEyes, right: worriedEyes },
    mouth: 'frown',
  },
  surprised: {
    gaze: 'still',
    body: 'pulse',
    eyes: { left: surprisedEyes, right: surprisedEyes },
    mouth: 'open-oh',
  },
  sleeping: {
    gaze: 'still',
    eyes: { left: sleepingEyes, right: sleepingEyes },
    mouth: null,
    isEyesShut: true,
  },
}
