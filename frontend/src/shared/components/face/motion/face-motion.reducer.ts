import { assign, setup } from 'xstate'

import type { Body, EyeLife, Pose } from '../face.types'
import { blinkEveryMs, blinkMs } from './face-motion.constants'

/** What a mood asks of the motions of a face: the pose and the body, what each eye does by itself, and whether the eyes may blink. */
export interface MotionTarget {
  pose: Pose | 'none'
  body: Body
  lives: readonly [EyeLife, EyeLife]
  canBlink: boolean
}

/** The state of each motion of a face: the pose, the body, the left and the right eye, and the blink. `start` is where a motion is for no time, before it goes to the state that the look asks for. */
export interface FaceMotionValue {
  pose: Pose | 'none' | 'start'
  body: Body | 'start'
  leftEye: EyeLife | 'start'
  rightEye: EyeLife | 'start'
  blink: 'waiting' | 'blinking' | 'held'
}

interface FaceMotionContext {
  look: MotionTarget
  /** Where along its wait the first blink falls, from 0 to 1, so that faces side by side do not blink together. */
  phase: number
  isFirstWait: boolean
}

type FaceMotionEvent =
  /** The face shows another state, so another look: each motion goes to the state that it asks for. */
  | { type: 'LOOK'; look: MotionTarget }
  /** Nothing should start: the mood is changing, or the face is out of sight. */
  | { type: 'HOLD' }
  /** The face moves again. */
  | { type: 'RELEASE' }

const poses = ['none', 'sway', 'tilt'] as const satisfies readonly (Pose | 'none')[]
const bodies = [
  'none',
  'pulse',
  'breathe',
  'bounce',
  'turnaround',
] as const satisfies readonly Body[]
const lives = ['steady', 'breathe', 'squint', 'wink'] as const satisfies readonly EyeLife[]

/**
 * A region of one state per kind of a motion, which goes to the state that a look asks for. It does
 * so when it starts (from the look that the face is given) and at each new look. A motion that goes
 * by something other than the look, such as a sequence, adds its transitions to its own states.
 */
function followingRegion<Kind extends string>(
  kinds: readonly Kind[],
  read: (look: MotionTarget) => Kind,
) {
  const states = Object.fromEntries(kinds.map((kind) => [kind, {}])) as Record<Kind, object>
  return {
    initial: 'start',
    on: {
      LOOK: kinds.map((kind) => ({
        guard: ({ event }: { event: FaceMotionEvent }) =>
          event.type === 'LOOK' && read(event.look) === kind,
        target: `.${kind}`,
      })),
    },
    states: {
      start: {
        always: kinds.map((kind) => ({
          guard: ({ context }: { context: FaceMotionContext }) => read(context.look) === kind,
          target: kind,
        })),
      },
      ...states,
    },
  }
}

/**
 * The motions of a face, each in a region of its own, side by side:
 *
 * - `pose` and `body`: the motion of the whole face, one state for each (`none` for nothing);
 * - `leftEye` and `rightEye`: what each eye does by itself (`steady`, `breathe`, `squint`);
 * - `blink`: `waiting` with the eyes open, `blinking` for the time of a blink, and `held` while
 *   nothing should start (a mood is changing, or the face is out of sight). Eyes that cannot blink
 *   wait and do not blink.
 *
 * A look moves the first four to the states that it asks for. Each motion is a state, so that a
 * motion that has to follow another, such as two blinks in a row, is a transition of its own.
 */
export const faceMotionMachine = setup({
  types: {
    context: {} as FaceMotionContext,
    events: {} as FaceMotionEvent,
    input: {} as { look: MotionTarget; phase: number },
  },
  delays: {
    wait: ({ context }) => (context.isFirstWait ? context.phase * blinkEveryMs : blinkEveryMs),
    blink: blinkMs,
  },
  guards: {
    canBlink: ({ context }) => context.look.canBlink,
  },
  actions: {
    takeLook: assign(({ event }) => (event.type === 'LOOK' ? { look: event.look } : {})),
    endFirstWait: assign({ isFirstWait: false }),
  },
}).createMachine({
  id: 'faceMotion',
  type: 'parallel',
  context: ({ input }) => ({ look: input.look, phase: input.phase, isFirstWait: true }),
  on: { LOOK: { actions: 'takeLook' } },
  states: {
    pose: followingRegion(poses, (look) => look.pose),
    body: followingRegion(bodies, (look) => look.body),
    leftEye: followingRegion(lives, (look) => look.lives[0]),
    rightEye: followingRegion(lives, (look) => look.lives[1]),
    blink: {
      initial: 'waiting',
      on: { HOLD: '.held', RELEASE: '.waiting' },
      states: {
        waiting: {
          exit: 'endFirstWait',
          after: {
            wait: [
              { guard: 'canBlink', target: 'blinking' },
              // Eyes that cannot blink wait again.
              { target: 'waiting', reenter: true },
            ],
          },
        },
        blinking: { after: { blink: 'waiting' } },
        held: {},
      },
    },
  },
})
