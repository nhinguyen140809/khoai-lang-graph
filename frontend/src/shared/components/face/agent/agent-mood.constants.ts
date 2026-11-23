import type { FaceState, Mood } from '../face.types'
import type { AgentMoodLook } from './agent-face.types'

const longEyes = ['long', 'long'] as const
const evenEyes = [1, 1] as const
const levelEyes = [0, 0] as const

/** What each mood does to a face: thinking has two round eyes, one large and one half its area, and looks about as an idle face would if it moved more; surprise opens two round eyes wide and pulses; waiting breathes, glances from side to side and turns right around now and then; sleep shuts them. */
export const moodLooks: Readonly<Record<Mood, AgentMoodLook>> = {
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

/** The looks of every state of a face: the moods, the rest that a face of some moods comes to, and the steps of a mood that goes through looks. An idle face looks to one side and keeps still; a happy face stops swaying and keeps its smile; a thinking face goes on from its large and small round eyes to long ones, and then to long ones that squint. */
export const faceLooks: Readonly<Record<FaceState, AgentMoodLook>> = {
  ...moodLooks,
  'thinking-long': {
    ...moodLooks.thinking,
    eyes: longEyes,
    eyeScales: evenEyes,
    eyeLives: ['steady', 'steady'],
  },
  'thinking-squint': {
    ...moodLooks.thinking,
    eyes: longEyes,
    eyeScales: evenEyes,
    eyeLives: ['squint', 'squint'],
  },
  'resting-idle': { ...moodLooks.idle, gaze: 'toward' },
  'resting-happy': {
    gaze: 'still',
    eyes: ['arc', 'arc'],
    eyeScales: evenEyes,
    tilts: levelEyes,
    pace: 'calm',
  },
}
