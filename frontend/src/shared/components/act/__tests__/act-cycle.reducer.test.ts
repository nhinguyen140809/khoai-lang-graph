import { describe, expect, it } from 'vitest'
import { createActor, SimulatedClock } from 'xstate'

import { actDwellRounds, actFadeMs, acts } from '../act.constants'
import type { ActKey } from '../act.types'
import { wantedActOf } from '../act.utils'
import { actCycleMachine } from '../act-cycle.reducer'

const dwellMs = (key: ActKey) => (acts[key]?.loopMs ?? 0) * actDwellRounds

function started(drawn: readonly ActKey[], isRunning = true) {
  const clock = new SimulatedClock()
  const actor = createActor(actCycleMachine, { input: { drawn, isRunning }, clock }).start()
  const context = () => actor.getSnapshot().context
  return { actor, clock, context }
}

describe('actCycleMachine', () => {
  it('shows none when no act is drawn', () => {
    const { context } = started([])

    expect(context().shown).toBeNull()
  })

  it('stays with one act for ever', () => {
    const { clock, context } = started(['write'])

    clock.increment(dwellMs('write') * 3)

    expect(context().shown).toBe('write')
    expect(context().swaps).toBe(0)
  })

  it('goes from act to act after the rounds of each, smoothly, and again from the first', () => {
    const { clock, context } = started(['write', 'typing'])
    expect(context().shown).toBe('write')

    clock.increment(dwellMs('write'))
    expect(wantedActOf(context().drawn, context().index)).toBe('typing')
    expect(context().shown).toBe('write')

    clock.increment(actFadeMs.out)
    expect(context().shown).toBe('typing')
    expect(context().swaps).toBe(1)

    clock.increment(dwellMs('typing') - actFadeMs.out)
    clock.increment(actFadeMs.out)
    expect(context().shown).toBe('write')
    expect(context().swaps).toBe(2)
  })

  it('waits while it is not running, and goes on from the start of the act when it runs', () => {
    const { actor, clock, context } = started(['write', 'typing'], false)

    clock.increment(dwellMs('write') * 2)
    expect(context().shown).toBe('write')

    actor.send({ type: 'RUN' })
    clock.increment(dwellMs('write') - 1)
    expect(context().shown).toBe('write')
    clock.increment(1)
    clock.increment(actFadeMs.out)
    expect(context().shown).toBe('typing')
  })

  it('stops the time of an act when it is paused', () => {
    const { actor, clock, context } = started(['write', 'typing'])

    clock.increment(dwellMs('write') - 10)
    actor.send({ type: 'PAUSE' })
    clock.increment(dwellMs('write') * 2)

    expect(context().shown).toBe('write')
  })

  it('starts from its first act when the list is another, and keeps its time when it is the same', () => {
    const { actor, clock, context } = started(['write', 'typing'])
    clock.increment(dwellMs('write'))
    clock.increment(actFadeMs.out)
    expect(context().shown).toBe('typing')

    actor.send({ type: 'ACTS', drawn: ['write', 'typing'] })
    clock.increment(dwellMs('typing'))
    clock.increment(actFadeMs.out)
    expect(context().shown).toBe('write')

    actor.send({ type: 'ACTS', drawn: ['typing', 'search'] })
    expect(wantedActOf(context().drawn, context().index)).toBe('typing')
    clock.increment(actFadeMs.out)
    expect(context().shown).toBe('typing')
  })

  it('shows none when a list with no drawn act comes', () => {
    const { actor, clock, context } = started(['write'])

    actor.send({ type: 'ACTS', drawn: [] })
    clock.increment(actFadeMs.out)

    expect(context().shown).toBeNull()
  })
})
