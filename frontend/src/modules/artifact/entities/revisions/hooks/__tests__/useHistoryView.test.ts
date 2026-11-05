import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useHistoryView } from '../useHistoryView'

function viewOf(currentVersion: number, isHidden = false) {
  return renderHook(
    ({ version, hidden }: { version: number; hidden: boolean }) =>
      useHistoryView(version, { isHidden: hidden }),
    { initialProps: { version: currentVersion, hidden: isHidden } },
  )
}

describe('useHistoryView', () => {
  it('starts closed, with the current version selected and the changes hidden', () => {
    const { result } = viewOf(3)

    expect(result.current.level).toBe('closed')
    expect(result.current.selectedVersion).toBe(3)
    expect(result.current.showsChanges).toBe(false)
  })

  it('opens, steps through the levels, and closes back onto the current version', () => {
    const { result } = viewOf(3)

    act(() => {
      result.current.open()
    })
    expect(result.current.level).toBe('version')

    act(() => {
      result.current.select(2)
    })
    act(() => {
      result.current.setShowsChanges(true)
    })
    act(() => {
      result.current.toggleList()
    })
    expect(result.current.level).toBe('list')

    act(() => {
      result.current.stepBack()
    })
    expect(result.current.level).toBe('version')
    act(() => {
      result.current.stepBack()
    })
    expect(result.current.level).toBe('closed')
    expect(result.current.selectedVersion).toBe(3)
    expect(result.current.showsChanges).toBe(false)
  })

  it('selects a new current version and keeps the level', () => {
    const { result, rerender } = viewOf(2)

    act(() => {
      result.current.open()
    })
    act(() => {
      result.current.select(1)
    })
    rerender({ version: 3, hidden: false })

    expect(result.current.selectedVersion).toBe(3)
    expect(result.current.level).toBe('version')
  })

  it('closes when it is hidden, and opens again after', () => {
    const { result, rerender } = viewOf(2, false)

    act(() => {
      result.current.open()
    })
    rerender({ version: 2, hidden: true })
    expect(result.current.level).toBe('closed')

    rerender({ version: 2, hidden: false })
    act(() => {
      result.current.open()
    })
    expect(result.current.level).toBe('version')
  })
})
