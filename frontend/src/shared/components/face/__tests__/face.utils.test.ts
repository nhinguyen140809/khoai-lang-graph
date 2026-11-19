import { describe, expect, it } from 'vitest'

import { eyeGeometries, eyeLine } from '../face.constants'
import type { EyeKind } from '../face.types'
import { browPath, eyeCentersOf } from '../face.utils'

const kinds = Object.keys(eyeGeometries) as EyeKind[]
const round = (scale = 1) => ({ kind: 'round', cx: 12, scale }) as const

describe('browPath', () => {
  it('keeps a neutral path for no brow, which is not shown', () => {
    expect(browPath('none', 'left', round())).toBe(browPath('flat', 'left', round()))
  })

  it.each(['none', 'arch', 'raised', 'flat', 'slant'] as const)(
    'draws the %s brow with one curve, so that it can move to any other',
    (brow) => {
      expect(browPath(brow, 'left', round()).match(/[A-Za-z]/g)).toEqual(['M', 'Q'])
    },
  )

  it('slopes the two brows of a worried face down to the sides, not the same way', () => {
    expect(browPath('slant', 'left', round())).not.toBe(browPath('slant', 'right', round()))
  })

  it.each(kinds)('keeps the brow above the top of a %s eye', (kind) => {
    const numbers = (
      browPath('slant', 'left', { kind, cx: 12, scale: 1 }).match(/-?[\d.]+/g) ?? []
    ).map(Number)
    const heights = [numbers[1], numbers[3], numbers[5]]

    for (const height of heights) {
      expect(height).toBeLessThan(eyeLine - eyeGeometries[kind].halfHeight)
    }
  })

  it('rises with the eyes when they are larger', () => {
    const peak = (scale: number) =>
      Number(browPath('arch', 'left', round(scale)).match(/-?[\d.]+/g)?.[3])
    const usual = peak(1)
    const larger = peak(1.25)

    expect(larger).toBeLessThan(usual)
  })
})

describe('eyeCentersOf', () => {
  it('puts the eyes the same distance either side of the middle of the face', () => {
    const [left, right] = eyeCentersOf('round', 'mid')

    expect(left + right).toBeCloseTo(32)
  })

  it.each(kinds)('leaves a clear space between two %s eyes, even the nearest', (kind) => {
    const [left, right] = eyeCentersOf(kind, 'near')

    expect(right - left - 2 * eyeGeometries[kind].halfWidth).toBeGreaterThan(1.5)
  })

  it('puts far eyes further apart than near ones', () => {
    const near = eyeCentersOf('round', 'near')
    const far = eyeCentersOf('round', 'far')

    expect(far[1] - far[0]).toBeGreaterThan(near[1] - near[0])
  })

  it('keeps larger eyes clear of each other', () => {
    const [left, right] = eyeCentersOf('slim', 'near', 1.25)

    expect(right - left - 2 * eyeGeometries.slim.halfWidth * 1.25).toBeGreaterThan(1.5)
  })
})
