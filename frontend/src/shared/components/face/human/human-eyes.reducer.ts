import { assign, setup } from 'xstate'

import type { EyeStep, HumanEyesLook } from './human-face.types'

/** Where an eye is in its round of steps. */
interface EyeTrack {
  steps: readonly EyeStep[]
  index: number
}

interface HumanEyesContext {
  left: EyeTrack
  right: EyeTrack
}

interface HumanEyesEvent {
  type: 'LOOK'
  eyes: HumanEyesLook
}

const start = (steps: readonly EyeStep[]): EyeTrack => ({ steps, index: 0 })

/** The eye at the step after this one. */
function next({ steps, index }: EyeTrack): EyeTrack {
  return { steps, index: (index + 1) % Math.max(steps.length, 1) }
}

/** The step that an eye is at, with the first step for an eye with none. */
export function stepOf({ steps, index }: EyeTrack): EyeStep {
  return steps[index] ?? steps[0] ?? { role: 'rest', ms: 0 }
}

/**
 * The eyes of a face of a person, each in a region of its own, side by side: an eye is at one step
 * of its round of steps at a time (see `HumanEyesLook`), and goes on to the next when the time of
 * the step has passed. The eyes of a mood may have rounds of their own: one eye shuts while the
 * other stays, and a look of the mood starts both rounds again. The state is the step of each; what
 * a step looks like is the business of the face (see `eyeShapeOf`).
 */
export const humanEyesMachine = setup({
  types: {
    context: {} as HumanEyesContext,
    events: {} as HumanEyesEvent,
    input: {} as { eyes: HumanEyesLook },
  },
  delays: {
    leftStep: ({ context }) => stepOf(context.left).ms,
    rightStep: ({ context }) => stepOf(context.right).ms,
  },
  actions: {
    startBoth: assign(({ event }) => ({
      left: start(event.eyes.left),
      right: start(event.eyes.right),
    })),
    nextLeft: assign(({ context }) => ({ left: next(context.left) })),
    nextRight: assign(({ context }) => ({ right: next(context.right) })),
  },
}).createMachine({
  id: 'humanEyes',
  type: 'parallel',
  context: ({ input }) => ({ left: start(input.eyes.left), right: start(input.eyes.right) }),
  on: { LOOK: { target: ['.left.step', '.right.step'], reenter: true, actions: 'startBoth' } },
  states: {
    left: {
      initial: 'step',
      states: {
        step: { after: { leftStep: { target: 'step', reenter: true, actions: 'nextLeft' } } },
      },
    },
    right: {
      initial: 'step',
      states: {
        step: { after: { rightStep: { target: 'step', reenter: true, actions: 'nextRight' } } },
      },
    },
  },
})
