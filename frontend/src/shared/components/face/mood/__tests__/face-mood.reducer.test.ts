import { describe, expect, it } from 'vitest'
import { createActor, SimulatedClock } from 'xstate'

import type { Mood } from '../../face.types'
import { moodCycles, restAfterMs, swapFallbackMs } from '../face-mood.constants'
import { faceMoodMachine } from '../face-mood.reducer'

function started(mood: Mood) {
  const clock = new SimulatedClock()
  const actor = createActor(faceMoodMachine, { input: { mood }, clock }).start()
  return { actor, clock }
}

const give = (mood: Mood, isStill = false) => ({ type: 'MOOD', mood, isStill }) as const

describe('faceMoodMachine', () => {
  it('shows the mood it starts with', () => {
    const { actor } = started('thinking')

    expect(actor.getSnapshot().value).toBe('steady')
    expect(actor.getSnapshot().context.shown).toBe('thinking')
  })

  it('covers a change: the old state stays until the eyes have closed', () => {
    const { actor } = started('idle')

    actor.send(give('happy'))
    expect(actor.getSnapshot().value).toBe('covering')
    expect(actor.getSnapshot().context.shown).toBe('idle')

    actor.send({ type: 'SETTLE' })
    expect(actor.getSnapshot().value).toBe('steady')
    expect(actor.getSnapshot().context.shown).toBe('happy')
  })

  it('shows the new mood after a while if the eyes never say they have closed', () => {
    const { actor, clock } = started('idle')

    actor.send(give('worried'))
    clock.increment(swapFallbackMs)

    expect(actor.getSnapshot().context.shown).toBe('worried')
  })

  it('starts a new cover when a mood comes in the middle of one', () => {
    const { actor, clock } = started('idle')

    actor.send(give('happy'))
    clock.increment(swapFallbackMs - 100)
    actor.send(give('surprised'))
    clock.increment(swapFallbackMs - 100)
    expect(actor.getSnapshot().context.shown).toBe('idle')

    actor.send({ type: 'SETTLE' })
    expect(actor.getSnapshot().context.shown).toBe('surprised')
  })

  it('ignores the mood it already has', () => {
    const { actor } = started('idle')

    actor.send(give('idle'))

    expect(actor.getSnapshot().value).toBe('steady')
  })

  it('shows a new mood at once for a user who asked for less motion', () => {
    const { actor } = started('idle')

    actor.send(give('happy', true))

    expect(actor.getSnapshot().value).toBe('steady')
    expect(actor.getSnapshot().context.shown).toBe('happy')
  })

  it('comes to rest after a long time in a mood that does, and not in one that does not', () => {
    const resting = started('happy')
    resting.clock.increment(restAfterMs)
    expect(resting.actor.getSnapshot().context.shown).toBe('resting-happy')

    const working = started('working')
    working.clock.increment(restAfterMs)
    expect(working.actor.getSnapshot().context.shown).toBe('working')
  })

  it('leaves the rest through a cover when it is given another mood', () => {
    const { actor, clock } = started('idle')
    clock.increment(restAfterMs)

    actor.send(give('thinking'))
    expect(actor.getSnapshot().value).toBe('covering')
    expect(actor.getSnapshot().context.shown).toBe('resting-idle')

    actor.send({ type: 'SETTLE' })
    expect(actor.getSnapshot().context.shown).toBe('thinking')
  })

  it('starts the time to rest again after a change', () => {
    const { actor, clock } = started('idle')
    clock.increment(restAfterMs - 1000)

    actor.send(give('happy'))
    actor.send({ type: 'SETTLE' })
    clock.increment(restAfterMs - 1000)
    expect(actor.getSnapshot().context.shown).toBe('happy')

    clock.increment(1000)
    expect(actor.getSnapshot().context.shown).toBe('resting-happy')
  })

  describe('a mood that goes through looks', () => {
    const [first, second, third] = moodCycles.thinking ?? []
    const steps = [first, second, third]

    it('covers each change with a blink and goes on from look to look, and round again', () => {
      const { actor, clock } = started('thinking')
      expect(actor.getSnapshot().context.shown).toBe(steps[0]?.state)

      for (const [index, step] of steps.entries()) {
        const next = steps[(index + 1) % steps.length]
        clock.increment(step?.ms ?? 0)
        expect(actor.getSnapshot().value).toBe('covering')
        expect(actor.getSnapshot().context.shown).toBe(step?.state)

        actor.send({ type: 'SETTLE' })
        expect(actor.getSnapshot().value).toBe('steady')
        expect(actor.getSnapshot().context.shown).toBe(next?.state)
      }
    })

    it('starts again from the first look when the mood is another and comes back', () => {
      const { actor, clock } = started('thinking')
      clock.increment(first?.ms ?? 0)
      actor.send({ type: 'SETTLE' })
      expect(actor.getSnapshot().context.shown).toBe(second?.state)

      actor.send(give('working'))
      actor.send({ type: 'SETTLE' })
      actor.send(give('thinking'))
      actor.send({ type: 'SETTLE' })

      expect(actor.getSnapshot().context.shown).toBe(first?.state)
    })

    it('leaves a mood without a cycle as it is', () => {
      const { actor, clock } = started('working')

      clock.increment(60000)

      expect(actor.getSnapshot().value).toBe('steady')
      expect(actor.getSnapshot().context.shown).toBe('working')
    })
  })
})
