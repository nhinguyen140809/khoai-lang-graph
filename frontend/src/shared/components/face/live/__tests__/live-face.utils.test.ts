import { describe, expect, it } from 'vitest'

import { eyeGeometries } from '../../face.constants'
import { facePresets } from '../../look/face-preset.constants'
import { faceLooks, moodLooks } from '../../mood/face-mood.constants'
import { liveUnit } from '../live-face.constants'
import { liveValuesOf } from '../live-face.utils'

const look = { ...facePresets[0], phase: 0.5 }

describe('liveValuesOf', () => {
  it('draws the outline and the gap of the look', () => {
    const values = liveValuesOf(look, moodLooks.idle, false)

    expect(values.silhouette).toBe(look.shape)
    expect(values.eyeGap).toBeGreaterThan(0)
  })

  it('sizes each eye by its kind and its scale, as the plain face does', () => {
    const values = liveValuesOf(look, moodLooks.thinking, false)

    expect(values.eyeLeftWidth).toBeCloseTo(2 * eyeGeometries.round.halfWidth * 1.2 * liveUnit)
    expect(values.eyeRightHeight).toBeCloseTo(2 * eyeGeometries.round.halfHeight * 0.85 * liveUnit)
  })

  it('leans the eyes as the mood says', () => {
    const values = liveValuesOf(look, moodLooks.worried, false)

    expect([values.eyeLeftTilt, values.eyeRightTilt]).toEqual([12, -12])
  })

  it('makes a closed eye as flat as the table says', () => {
    const values = liveValuesOf(look, faceLooks.sleeping, false)

    expect(values.eyeLeftHeight).toBeLessThan(values.eyeLeftWidth)
  })

  it('draws a smiling eye as a line and an open one as an oval', () => {
    const smiling = liveValuesOf(look, moodLooks.happy, false)
    const open = liveValuesOf(look, moodLooks.idle, false)

    expect([smiling.eyeLeftOpen, smiling.eyeLeftArc, smiling.eyeRightShut]).toEqual([0, 1, 0])
    expect([open.eyeLeftOpen, open.eyeLeftArc, open.eyeRightShut]).toEqual([1, 0, 0])
  })

  it('draws a shut eye as a shut line', () => {
    const values = liveValuesOf(look, faceLooks.sleeping, false)

    expect([values.eyeLeftShut, values.eyeRightShut, values.eyeLeftOpen]).toEqual([1, 1, 0])
  })

  it('lands every change at once for a user who asked for less motion', () => {
    expect(liveValuesOf(look, moodLooks.idle, true).motionSeconds).toBe(0)
    expect(liveValuesOf(look, moodLooks.idle, false).motionSeconds).toBeGreaterThan(0)
  })

  it('puts the blobs inside the artboard', () => {
    const values = liveValuesOf(look, moodLooks.idle, false)

    for (const place of [values.coreX, values.coreY, values.secondX, values.secondY]) {
      expect(place).toBeGreaterThan(0)
      expect(place).toBeLessThan(320)
    }
  })
})
