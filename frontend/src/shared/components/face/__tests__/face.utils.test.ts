import { describe, expect, it } from 'vitest'

import { eyeGeometries } from '../face.constants'
import type { EyeKind } from '../face.types'
import { eyeCentersOf } from '../face.utils'

const kinds = Object.keys(eyeGeometries) as EyeKind[]

describe('eyeCentersOf', () => {
  it('puts two eyes of one kind the same distance either side of the middle of the face', () => {
    const [left, right] = eyeCentersOf(['long', 'long'], 'mid')

    expect(left + right).toBeCloseTo(32)
  })

  it.each(kinds)('leaves a clear space between two %s eyes, even the nearest', (kind) => {
    const [left, right] = eyeCentersOf([kind, kind], 'near')

    expect(right - left - 2 * eyeGeometries[kind].halfWidth).toBeGreaterThan(1.5)
  })

  it('puts far eyes further apart than near ones', () => {
    const near = eyeCentersOf(['long', 'long'], 'near')
    const far = eyeCentersOf(['long', 'long'], 'far')

    expect(far[1] - far[0]).toBeGreaterThan(near[1] - near[0])
  })

  it('keeps larger eyes clear of each other', () => {
    const [left, right] = eyeCentersOf(['long', 'long'], 'near', [1.7, 1.7])

    expect(right - left - 2 * eyeGeometries.long.halfWidth * 1.7).toBeGreaterThan(1.5)
  })

  it('keeps two eyes of different sizes clear of each other, and together in the middle of the face', () => {
    const scales = [1.45, 0.8] as const
    const [left, right] = eyeCentersOf(['round', 'round'], 'near', scales)
    const gap = right - left - eyeGeometries.round.halfWidth * (scales[0] + scales[1])

    expect(gap).toBeGreaterThan(1.5)
    expect(left - eyeGeometries.round.halfWidth * scales[0]).toBeCloseTo(
      32 - (right + eyeGeometries.round.halfWidth * scales[1]),
    )
  })
})
