import { describe, expect, it } from 'vitest'
import { createActor, SimulatedClock } from 'xstate'

import { blinkEveryMs, blinkMs } from '../face-motion.constants'
import { faceMotionMachine, type FaceMotionValue, type MotionRequest } from '../face-motion.reducer'

const still: MotionRequest = {
  pose: 'none',
  body: 'none',
  lives: ['steady', 'steady'],
  canBlink: true,
}

function started(look: MotionRequest, phase = 0) {
  const clock = new SimulatedClock()
  const actor = createActor(faceMotionMachine, { input: { look, phase }, clock }).start()
  const value = (): FaceMotionValue => actor.getSnapshot().value
  return { actor, clock, value }
}

describe('faceMotionMachine', () => {
  it('starts each motion in the state that the look asks for', () => {
    const { value } = started({
      pose: 'tilt',
      body: 'pulse',
      lives: ['breathe', 'squint'],
      canBlink: true,
    })

    expect(value()).toMatchObject({
      pose: 'tilt',
      body: 'pulse',
      leftEye: 'breathe',
      rightEye: 'squint',
    })
  })

  it('moves each motion to the state of a new look', () => {
    const { actor, value } = started(still)

    actor.send({
      type: 'LOOK',
      look: { pose: 'sway', body: 'breathe', lives: ['steady', 'squint'], canBlink: true },
    })

    expect(value()).toMatchObject({
      pose: 'sway',
      body: 'breathe',
      leftEye: 'steady',
      rightEye: 'squint',
    })
  })

  it('blinks after its wait and opens its eyes again after the time of a blink', () => {
    const { clock, value } = started(still)

    expect(value().blink).toBe('waiting')
    clock.increment(0)
    expect(value().blink).toBe('blinking')
    clock.increment(blinkMs)
    expect(value().blink).toBe('waiting')
    clock.increment(blinkEveryMs - 1)
    expect(value().blink).toBe('waiting')
    clock.increment(1)
    expect(value().blink).toBe('blinking')
  })

  it('starts the first blink of a face part of the way through the wait, by its phase', () => {
    const { clock, value } = started(still, 0.5)

    clock.increment(blinkEveryMs * 0.5 - 1)
    expect(value().blink).toBe('waiting')
    clock.increment(1)
    expect(value().blink).toBe('blinking')
  })

  it('does not blink with eyes that cannot, and goes on waiting', () => {
    const { clock, value } = started({ ...still, canBlink: false })

    clock.increment(blinkEveryMs * 3)
    expect(value().blink).toBe('waiting')
  })

  it('blinks no more while held, and waits again from the start once released', () => {
    const { actor, clock, value } = started(still, 1)

    actor.send({ type: 'HOLD' })
    clock.increment(blinkEveryMs * 2)
    expect(value().blink).toBe('held')

    actor.send({ type: 'RELEASE' })
    expect(value().blink).toBe('waiting')
    clock.increment(blinkEveryMs)
    expect(value().blink).toBe('blinking')
  })
})
