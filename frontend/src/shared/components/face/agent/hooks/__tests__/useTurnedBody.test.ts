import { renderHook } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { describe, expect, it } from 'vitest'

import type { BodyStyle } from '../../../motion/hooks/useBodyStyles'
import { useTurnedBody } from '../useTurnedBody'

const body: BodyStyle = {
  x: motionValue('0%'),
  y: motionValue('0%'),
  rotate: motionValue(0),
  rotateX: motionValue(20),
  rotateY: motionValue(30),
  scale: motionValue(1),
  scaleX: motionValue(1),
  scaleY: motionValue(1),
}
const head = { rotateX: motionValue(1), rotateY: motionValue(2), rotateZ: motionValue(3) }

describe('useTurnedBody', () => {
  it('adds the turns of the head to those of the body', () => {
    const { result } = renderHook(() => useTurnedBody(body, head))
    const get = (value: unknown) => (value as { get: () => number }).get()

    expect(get(result.current.rotateX)).toBe(21)
    expect(get(result.current.rotateY)).toBe(32)
    expect(get(result.current.rotateZ)).toBe(3)
  })
})
