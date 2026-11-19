import { describe, expect, it } from 'vitest'

import { faceColors } from '../face-look.constants'
import type { FaceLook } from '../face-look.types'
import { blobStyleOf, delayOf, partStyle } from '../face-style.utils'

const spots = [
  { x: 20, y: 30 },
  { x: 60, y: 40 },
] as const

const blobs = [
  { shape: 'round', turn: 30 },
  { shape: 'streak', turn: 120 },
] as const

const oneColor: FaceLook = {
  colors: [faceColors[0]],
  reach: 55,
  blobs,
  spots,
  eyes: 'round',
  gap: 'mid',
  phase: 0.5,
}
const twoColors: FaceLook = {
  colors: [faceColors[0], faceColors[5]],
  reach: 60,
  blobs,
  spots,
  eyes: 'round',
  gap: 'mid',
  phase: 0.25,
}

describe('blobStyleOf', () => {
  it('sets the colors, the places and the phase of the face', () => {
    const style = blobStyleOf(twoColors) as Record<string, unknown>

    expect(style['--face-a']).toContain(faceColors[0])
    expect(style['--face-a']).toContain('--face-core-chroma-max')
    expect(style['--face-b']).toContain(faceColors[5])
    expect(style['--face-ax']).toBe('20%')
    expect(style['--face-by']).toBe('40%')
    expect(style['--face-phase']).toBe(0.25)
    expect(style['--face-core-turn']).toBe('30deg')
    expect(style['--face-second-turn']).toBe('120deg')
  })

  it('lifts the second color a little, more for the shade of a single color', () => {
    const one = blobStyleOf(oneColor) as Record<string, string>
    const two = blobStyleOf(twoColors) as Record<string, string>

    expect(one['--face-b']).toContain(`${faceColors[0]}, var(--face-lift) 10%`)
    expect(two['--face-b']).toContain(`${faceColors[5]}, var(--face-lift) 0%`)
  })

  it('lays the blobs of color on a paler base', () => {
    const two = blobStyleOf(twoColors) as Record<string, string>

    expect(two['--face-base']).toContain(`${faceColors[5]}, var(--face-lift) var(--face-base-lift)`)
  })

  it('says how wide the deep blob is', () => {
    const two = blobStyleOf(twoColors) as Record<string, string>

    expect(two['--face-reach']).toBe('60%')
  })
})

describe('delayOf', () => {
  it('starts an animation part of the way through its time, by the phase of the face', () => {
    expect(delayOf('--duration-face-blink')).toEqual({
      animationDelay: 'calc(var(--face-phase) * var(--duration-face-blink) * -1)',
    })
  })

  it('has no delay for a motion that has no time', () => {
    expect(delayOf(null)).toEqual({})
  })
})

describe('partStyle', () => {
  it('gives the path to the browser as a style, and shows or fades the part', () => {
    expect(partStyle('M0 0Q1 1 2 2', true)).toEqual({ d: 'path("M0 0Q1 1 2 2")', opacity: 1 })
    expect(partStyle('M0 0Q1 1 2 2', false)).toMatchObject({ opacity: 0 })
  })
})
