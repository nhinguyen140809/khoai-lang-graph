import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { PaletteCommand } from '../../command.types'
import { useCommandsStore } from '../../commands.store'
import { useCommands } from '../useCommands'
import { hotkeyCases } from './useCommands.data'

function registered(): PaletteCommand[] {
  return [...useCommandsStore.getState().sources.values()].flat()
}

function command(id: string, overrides: Partial<PaletteCommand> = {}): PaletteCommand {
  return { id, label: id, group: 'View', run: vi.fn(), ...overrides }
}

describe('useCommands', () => {
  it('registers the commands while the component is mounted', () => {
    const { unmount } = renderHook(() => {
      useCommands([command('a'), command('b')])
    })

    expect(registered().map(({ id }) => id)).toEqual(['a', 'b'])

    unmount()

    expect(registered()).toEqual([])
  })

  it('runs the latest run, though the commands did not register again', () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender } = renderHook(
      ({ run }) => {
        useCommands([command('a', { run })])
      },
      { initialProps: { run: first } },
    )

    rerender({ run: latest })
    registered()[0]?.run?.()

    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()
  })

  it('registers again when a label changes, in the same place', () => {
    const { rerender } = renderHook(
      ({ label }) => {
        useCommands([command('a', { label })])
      },
      { initialProps: { label: 'Expand steps' } },
    )
    renderHook(() => {
      useCommands([command('b')])
    })

    rerender({ label: 'Collapse steps' })

    expect(registered().map(({ label }) => label)).toEqual(['Collapse steps', 'b'])
  })

  it.each(hotkeyCases)('$name', ({ key, runs, prevents }) => {
    const run = vi.fn()
    renderHook(() => {
      useCommands([
        command('a', { hotkey: { key: 'b', mod: true }, run }),
        { id: 'loading', label: 'Loading...', group: 'View', hotkey: { key: 'l', mod: true } },
      ])
    })

    // fireEvent returns false when the default was prevented.
    const isAllowed = fireEvent.keyDown(document, { key, ctrlKey: true })

    expect(run).toHaveBeenCalledTimes(runs)
    expect(isAllowed).toBe(!prevents)
  })
})
