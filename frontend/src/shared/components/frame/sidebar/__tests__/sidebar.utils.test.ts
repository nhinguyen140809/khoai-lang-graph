import { describe, expect, it } from 'vitest'

import { clampSidebarWidth, sidebarSizeAt } from '../sidebar.utils'
import { clampCases, sizeCases, widths } from './sidebar.utils.data'

describe('sidebarSizeAt', () => {
  it.each(sizeCases)('keeps the side list $name', ({ pointerWidth, expected }) => {
    expect(sidebarSizeAt(pointerWidth, widths)).toEqual(expected)
  })
})

describe('clampSidebarWidth', () => {
  it.each(clampCases)('holds $name', ({ width, expected }) => {
    expect(clampSidebarWidth(width, widths)).toBe(expected)
  })
})
