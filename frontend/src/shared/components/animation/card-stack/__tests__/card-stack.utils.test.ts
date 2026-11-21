import { describe, expect, it } from 'vitest'

import { cardModeOf, cardMotion, depthOf } from '../card-stack.utils'

describe('depthOf', () => {
  it('is 0 for the front card and counts the places behind it', () => {
    expect([0, 1, 2].map((index) => depthOf(index, 0, 3))).toEqual([0, 1, 2])
  })

  it('wraps around: the card that was in front goes to the back', () => {
    expect([0, 1, 2].map((index) => depthOf(index, 1, 3))).toEqual([2, 0, 1])
    expect([0, 1, 2].map((index) => depthOf(index, 2, 3))).toEqual([1, 2, 0])
  })
})

describe('cardModeOf', () => {
  it.each([
    [true, true, 'still'],
    [true, false, 'still'],
    [false, true, 'leaving'],
    [false, false, 'resting'],
  ] as const)('is %s still, %s leaving: %s', (isStill, isLeaving, mode) => {
    expect(cardModeOf(isStill, isLeaving)).toBe(mode)
  })
})

describe('cardMotion', () => {
  it('puts the front card whole and the cards behind higher, smaller and fainter', () => {
    const front = cardMotion('resting', 0, 3)
    const behind = cardMotion('resting', 2, 3)
    expect(front.card.animate).toMatchObject({ y: -0, scale: 1, zIndex: 3 })
    expect(front.content.animate).toEqual({ opacity: 1 })
    expect(behind.card.animate).toMatchObject({ zIndex: 1 })
    expect(behind.content.animate).not.toEqual({ opacity: 1 })
  })

  it('moves a card that is still to its place without time', () => {
    expect(cardMotion('still', 1, 3).card.transition).toEqual({ duration: 0 })
  })

  it('has the card that leaves end where it would rest, over the others while it goes', () => {
    const { card } = cardMotion('leaving', 1, 3)
    const rest = cardMotion('resting', 1, 3).card.animate
    expect((card.animate.zIndex as number[])[0]).toBe(4)
    expect((card.animate.y as number[]).at(-1)).toBe(rest.y)
    expect((card.animate.opacity as number[]).at(-1)).toBe(1)
  })
})
