import { and, assign, setup } from 'xstate'

import { actDwellRounds, actFadeMs } from './act.constants'
import type { ActKey } from './act.types'
import { actOf, wantedActOf } from './act.utils'

/** What the machine of the acts of an actor holds: the acts that are drawn, the place of the one that is wanted among them, the one that is shown, and how many times the one shown has changed. */
interface ActCycleContext {
  drawn: readonly ActKey[]
  index: number
  shown: ActKey | null
  swaps: number
  isRunning: boolean
}

type ActCycleEvent =
  /** The list of acts is another: the acts of it that are drawn, in their order. */
  | { type: 'ACTS'; drawn: readonly ActKey[] }
  /** The actor is in sight, so that its acts go on. */
  | { type: 'RUN' }
  /** The actor is out of sight, so that its acts wait. */
  | { type: 'PAUSE' }

/**
 * The acts of an actor in two parts that run side by side.
 *
 * - `cycle` goes from act to act: it holds each act of the list for a few rounds (`dwelling`),
 *   then takes the next, and again from the first; it waits while the actor is out of sight
 *   (`paused`), and starts the time of an act again when it comes back or when the list is another.
 * - `display` shows the act that is wanted in two steps, so that a change is smooth: it is
 *   `steady` while the act shown is the one wanted; when they differ it is `swapping` for as long
 *   as what is around the face takes to go, and then shows the one wanted and counts a swap, so
 *   that the new act starts its round from the beginning.
 */
export const actCycleMachine = setup({
  types: {
    context: {} as ActCycleContext,
    events: {} as ActCycleEvent,
    input: {} as { drawn: readonly ActKey[]; isRunning: boolean },
  },
  delays: {
    dwell: ({ context }) =>
      (actOf(wantedActOf(context.drawn, context.index))?.loopMs ?? 0) * actDwellRounds,
    swap: actFadeMs.out,
  },
  guards: {
    isNewList: ({ context, event }) =>
      event.type === 'ACTS' && event.drawn.join() !== context.drawn.join(),
    isRunning: ({ context }) => context.isRunning,
    hasNext: ({ context }) => context.drawn.length > 1,
    isWantedChanged: ({ context }) => wantedActOf(context.drawn, context.index) !== context.shown,
  },
  actions: {
    takeList: assign(({ event }) =>
      event.type === 'ACTS' ? { drawn: event.drawn, index: 0 } : {},
    ),
    goNext: assign(({ context }) => ({ index: context.index + 1 })),
    showWanted: assign(({ context }) => ({
      shown: wantedActOf(context.drawn, context.index),
      swaps: context.swaps + 1,
    })),
    run: assign({ isRunning: true }),
    pause: assign({ isRunning: false }),
  },
}).createMachine({
  id: 'actCycle',
  type: 'parallel',
  context: ({ input }) => ({
    drawn: input.drawn,
    index: 0,
    shown: wantedActOf(input.drawn, 0),
    swaps: 0,
    isRunning: input.isRunning,
  }),
  on: {
    ACTS: [
      {
        guard: and(['isNewList', 'isRunning']),
        target: '.cycle.dwelling',
        reenter: true,
        actions: 'takeList',
      },
      { guard: 'isNewList', actions: 'takeList' },
    ],
  },
  states: {
    cycle: {
      initial: 'starting',
      on: {
        RUN: { target: '.dwelling', reenter: true, actions: 'run' },
        PAUSE: { target: '.paused', actions: 'pause' },
      },
      states: {
        starting: {
          always: [{ guard: 'isRunning', target: 'dwelling' }, { target: 'paused' }],
        },
        dwelling: {
          after: {
            dwell: { guard: 'hasNext', target: 'dwelling', reenter: true, actions: 'goNext' },
          },
        },
        paused: {},
      },
    },
    display: {
      initial: 'steady',
      states: {
        steady: { always: { guard: 'isWantedChanged', target: 'swapping' } },
        swapping: { after: { swap: { target: 'steady', actions: 'showWanted' } } },
      },
    },
  },
})
