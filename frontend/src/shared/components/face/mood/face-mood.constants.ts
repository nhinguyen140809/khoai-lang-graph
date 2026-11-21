import type { FaceState, Mood, MoodLook, RestingMood } from '../face.types'

const longEyes = ['long', 'long'] as const
const evenEyes = [1, 1] as const
const levelEyes = [0, 0] as const

/** What each mood does to a face: thinking has two round eyes, one large and one half its area, and looks about as an idle face would if it moved more; surprise opens two round eyes wide and pulses; waiting breathes, glances from side to side and turns right around now and then; sleep shuts them. */
export const moodLooks: Readonly<Record<Mood, MoodLook>> = {
  idle: { gaze: 'drift', eyes: longEyes, eyeScales: evenEyes, tilts: levelEyes, pace: 'calm' },
  thinking: {
    gaze: 'ponder',
    eyes: ['round', 'round'],
    eyeScales: [1.2, 0.85],
    pose: 'tilt',
    eyeLives: ['breathe', 'squint'],
    tilts: levelEyes,
    pace: 'busy',
  },
  working: { gaze: 'scan', eyes: longEyes, eyeScales: evenEyes, tilts: levelEyes, pace: 'busy' },
  waiting: {
    gaze: 'glance',
    eyes: longEyes,
    eyeScales: evenEyes,
    tilts: levelEyes,
    pace: 'calm',
    pose: 'rest',
    body: 'turnaround',
  },
  happy: {
    gaze: 'still',
    eyes: ['arc', 'arc'],
    eyeScales: evenEyes,
    tilts: levelEyes,
    pace: 'calm',
    pose: 'sway',
  },
  worried: { gaze: 'down', eyes: longEyes, eyeScales: evenEyes, tilts: [12, -12], pace: 'calm' },
  surprised: {
    gaze: 'still',
    eyes: ['round', 'round'],
    eyeScales: [1.2, 1.2],
    tilts: levelEyes,
    pace: 'calm',
    body: 'pulse',
  },
  sleeping: {
    gaze: 'still',
    eyes: ['shut', 'shut'],
    eyeScales: evenEyes,
    tilts: levelEyes,
    pace: 'calm',
    body: 'breathe',
  },
}

/** How long a change of mood waits for the eyes to close before it goes on, if they never say they have, in milliseconds. */
export const swapFallbackMs = 600

/** The moods whose face comes to rest, and the state that each comes to. */
export const restingStates = {
  idle: 'resting-idle',
  happy: 'resting-happy',
} as const satisfies Record<RestingMood, FaceState>

/** The looks of every state of a face: the moods, and the rest that a face of some moods comes to. An idle face looks to one side and keeps still; a happy face stops swaying and keeps its smile. */
export const faceLooks: Readonly<Record<FaceState, MoodLook>> = {
  ...moodLooks,
  'resting-idle': { ...moodLooks.idle, gaze: 'toward' },
  'resting-happy': {
    gaze: 'still',
    eyes: ['arc', 'arc'],
    eyeScales: evenEyes,
    tilts: levelEyes,
    pace: 'calm',
  },
}

/** How long a face of a mood that comes to rest has nothing to do before it does, in milliseconds. */
export const restAfterMs = 20000
