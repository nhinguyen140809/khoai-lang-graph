import { and, assign, setup } from 'xstate'

import type { FaceState, Mood } from '../face.types'
import { isRestingMood } from '../face.utils'
import { restAfterMs, restingStates, swapFallbackMs } from './face-mood.constants'

/** What the machine of the mood of a face holds: the mood that it was last given, and the state that the face shows. */
interface FaceMoodContext {
  mood: Mood
  shown: FaceState
}

type FaceMoodEvent =
  /** The face is given a mood; `isStill` is that the user asked for less motion, so that there is nothing to cover. */
  | { type: 'MOOD'; mood: Mood; isStill: boolean }
  /** The blink that covers a change of mood has closed the eyes. */
  | { type: 'SETTLE' }

/**
 * The states of a face by what happens to its mood, in three places:
 *
 * - `steady`: the face shows its mood. One that comes to rest (idle, happy) has nothing to do for
 *   `restAfterMs` and goes to `resting`.
 * - `resting`: the face shows the rest of its mood, until it is given another mood.
 * - `covering`: the mood has changed and the eyes are closing to cover it; the face still shows
 *   the old state until they have closed (`SETTLE`), or for `swapFallbackMs` if they never say so.
 *
 * A new mood starts a cover from any place, also from another cover; for a user who asked for less
 * motion it is shown at once.
 */
export const faceMoodMachine = setup({
  types: {
    context: {} as FaceMoodContext,
    events: {} as FaceMoodEvent,
    input: {} as { mood: Mood },
  },
  delays: { rest: restAfterMs, cover: swapFallbackMs },
  guards: {
    isNewMood: ({ context, event }) => event.type === 'MOOD' && event.mood !== context.mood,
    isStill: ({ event }) => event.type === 'MOOD' && event.isStill,
    comesToRest: ({ context }) => isRestingMood(context.mood),
  },
  actions: {
    takeMood: assign(({ event }) => (event.type === 'MOOD' ? { mood: event.mood } : {})),
    showMood: assign(({ context }) => ({ shown: context.mood })),
    showRest: assign(({ context }) => ({
      shown: isRestingMood(context.mood) ? restingStates[context.mood] : context.mood,
    })),
  },
}).createMachine({
  id: 'faceMood',
  initial: 'steady',
  context: ({ input }) => ({ mood: input.mood, shown: input.mood }),
  on: {
    MOOD: [
      // For a user who asked for less motion: shown at once, with nothing to cover.
      {
        guard: and(['isNewMood', 'isStill']),
        target: '.steady',
        reenter: true,
        actions: ['takeMood', 'showMood'],
      },
      { guard: 'isNewMood', target: '.covering', reenter: true, actions: 'takeMood' },
    ],
  },
  states: {
    steady: {
      after: { rest: { guard: 'comesToRest', target: 'resting' } },
    },
    resting: { entry: 'showRest' },
    covering: {
      after: { cover: { target: 'steady', actions: 'showMood' } },
      on: { SETTLE: { target: 'steady', actions: 'showMood' } },
    },
  },
})
