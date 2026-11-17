import { describe, expect, it } from 'vitest'

import { loopModeOf, stepMotion } from '../loop-step.utils'

describe('loopModeOf', () => {
  it.each([
    [true, true, 'still'],
    [true, false, 'still'],
    [false, true, 'once'],
    [false, false, 'loop'],
  ] as const)('is %s still, %s once: %s', (isStill, once, mode) => {
    expect(loopModeOf(isStill, once)).toBe(mode)
  })
})

describe('stepMotion', () => {
  it('shows a still step whole', () => {
    expect(stepMotion('still', 0.2, 4).animate).toEqual({ opacity: 1 })
  })

  it('fades a step in at its place and leaves it, when it plays once', () => {
    const { animate, transition } = stepMotion('once', 0.2, 4)
    expect(animate).toEqual({ opacity: [0, 0, 1] })
    expect(transition).not.toHaveProperty('repeat')
  })

  it('has a step of a loop start and end hidden, so that the loop has no seam', () => {
    const { animate, transition } = stepMotion('loop', 0.2, 4)
    const opacity = animate.opacity as number[]
    expect([opacity[0], opacity.at(-1)]).toEqual([0, 0])
    expect(transition).toMatchObject({ repeat: Infinity })
  })
})
