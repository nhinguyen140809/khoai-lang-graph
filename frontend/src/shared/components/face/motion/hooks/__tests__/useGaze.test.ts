import { renderHook } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { describe, expect, it } from 'vitest'

import type { FaceDrive } from '../../../face.types'
import { eyeReach, gazeLooks } from '../../face-motion.constants'
import { useFaceStyles } from '../useFaceStyles'
import { useGaze } from '../useGaze'

const timing = { phase: 0, isChanging: false, isRunning: true, reachShare: 1 }

function look(x: number, y: number, weight: number): NonNullable<FaceDrive['look']> {
  return { x: motionValue(x), y: motionValue(y), weight: motionValue(weight) }
}

describe('useGaze with a drive', () => {
  it('keeps its own gaze when the drive has no weight', () => {
    const { result } = renderHook(() => useGaze(gazeLooks.still, timing, look(2, -1, 0)))

    expect(result.current.eye.x.get()).toBe(0)
    expect(result.current.eye.y.get()).toBe(0)
  })

  it('looks where the drive says when its weight is full, the eyes reaching farther than the point', () => {
    const { result } = renderHook(() => useGaze(gazeLooks.still, timing, look(2, -1, 1)))

    expect(result.current.eye.x.get()).toBeCloseTo(2 * eyeReach.x)
    expect(result.current.eye.y.get()).toBeCloseTo(-eyeReach.y)
  })

  it('goes part of the way at a part of the weight', () => {
    const { result } = renderHook(() => useGaze(gazeLooks.still, timing, look(2, 0, 0.5)))

    expect(result.current.eye.x.get()).toBeCloseTo(eyeReach.x)
  })
})

describe('useFaceStyles with a move', () => {
  const move = {
    x: motionValue(0.1),
    y: motionValue(-0.2),
    rotate: motionValue(5),
    scale: motionValue(1.5),
  }

  it('adds the move to the body of the face', () => {
    const { result } = renderHook(() => {
      const gaze = useGaze(gazeLooks.still, timing)
      return useFaceStyles({}, gaze.head, timing, move)
    })
    const { bodyStyle } = result.current

    expect((bodyStyle.x as { get: () => string }).get()).toBe('10%')
    expect((bodyStyle.y as { get: () => string }).get()).toBe('-20%')
    expect((bodyStyle.rotate as { get: () => number }).get()).toBe(5)
    expect((bodyStyle.scale as { get: () => number }).get()).toBe(1.5)
  })
})

describe('useFaceStyles with a head', () => {
  it('keeps the turns of the head apart from those of the body', () => {
    const { result } = renderHook(() => {
      const gaze = useGaze(gazeLooks.still, timing)
      return useFaceStyles({}, gaze.head, timing)
    })
    const { headStyle, bodyStyle } = result.current

    expect(headStyle).toHaveProperty('rotateZ')
    expect(bodyStyle).not.toHaveProperty('rotateZ')
  })
})

describe('useGaze with a scale', () => {
  const placed = { ...timing, phase: 0.3 }
  const xOf = (scale?: number) => {
    const { result } = renderHook(() => useGaze(gazeLooks.glance, placed, undefined, scale))
    return result.current.eye.x.get()
  }

  it('takes all of the gaze when it is not given', () => {
    expect(xOf()).not.toBe(0)
    expect(xOf()).toBeCloseTo(xOf(1))
  })

  it('takes the part of the gaze that it says, for the eyes', () => {
    expect(xOf(0.5)).toBeCloseTo(xOf(1) / 2)
    expect(xOf(0)).toBe(0)
  })
})
