import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCommands } from '../hooks/useCommands'
import { canRunCommand, runCommand } from '../run-command.utils'

describe('runCommand', () => {
  it('runs a command that a mounted component registered, with its arguments', () => {
    const open = vi.fn()
    renderHook(() => {
      useCommands([{ id: 'open_document', run: open }])
    })

    runCommand('open_document', { artifact_id: 'a1' })

    expect(open).toHaveBeenCalledExactlyOnceWith({ artifact_id: 'a1' })
  })

  it('runs nothing once the component that registered it is gone', () => {
    const open = vi.fn()
    const { unmount } = renderHook(() => {
      useCommands([{ id: 'open_document', run: open }])
    })
    expect(canRunCommand('open_document')).toBe(true)

    unmount()
    runCommand('open_document')

    expect(canRunCommand('open_document')).toBe(false)
    expect(open).not.toHaveBeenCalled()
  })
})
