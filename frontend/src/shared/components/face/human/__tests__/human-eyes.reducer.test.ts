import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createActor } from 'xstate'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import { humanEyesMachine, stepOf } from '../human-eyes.reducer'
import type { HumanEyesLook } from '../human-face.types'

const look: HumanEyesLook = {
  left: [
    { role: 'rest', ms: 1000 },
    { role: 'shut', ms: 500 },
  ],
  right: [{ role: 'rest', ms: 3_600_000 }],
}

function started(eyes: HumanEyesLook = look) {
  const actor = createActor(humanEyesMachine, { input: { eyes } })
  actor.start()
  return actor
}

const roles = (actor: ReturnType<typeof started>) => {
  const { left, right } = actor.getSnapshot().context
  return [stepOf(left).role, stepOf(right).role]
}

describe('humanEyesMachine', () => {
  withFakeTimers()

  it('starts each eye at the first step of its round', () => {
    expect(roles(started())).toEqual(['rest', 'rest'])
  })

  it('goes on to the next step when the time of the step has passed, and comes round again after the last', () => {
    const actor = started()

    advanceTimers(999)
    expect(roles(actor)).toEqual(['rest', 'rest'])
    advanceTimers(1)
    expect(roles(actor)).toEqual(['shut', 'rest'])
    advanceTimers(500)
    expect(roles(actor)).toEqual(['rest', 'rest'])
  })

  it('lets an eye go its own way: the other eye keeps its step', () => {
    const actor = started()

    advanceTimers(1000)

    expect(roles(actor)[0]).toBe('shut')
    expect(roles(actor)[1]).toBe('rest')
  })

  it('starts both rounds again at a new look', () => {
    const actor = started()
    advanceTimers(1000)

    act(() => {
      actor.send({
        type: 'LOOK',
        eyes: { left: [{ role: 'wide', ms: 100 }], right: [{ role: 'smile', ms: 100 }] },
      })
    })

    expect(roles(actor)).toEqual(['wide', 'smile'])
  })

  it('reads a step with none as the first, and an eye with no steps as at rest', () => {
    expect(stepOf({ steps: [], index: 0 }).role).toBe('rest')
    expect(stepOf({ steps: look.left, index: 9 }).role).toBe('rest')
  })
})
