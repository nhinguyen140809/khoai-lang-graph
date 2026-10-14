import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MOCK_RUN_ID } from '@/mocks/runs/runs.handlers'
import { TestProviders } from '@/test/TestProviders'

import { useChat } from '../useChat'

describe('useChat', () => {
  it('starts a run with the message, then adds its turn and clears the message', async () => {
    const { result } = renderHook(() => useChat('t1'), { wrapper: TestProviders })

    act(() => {
      result.current.setDraft('  Build a mentor platform  ')
    })
    act(() => {
      result.current.send()
    })

    await waitFor(() => {
      expect(result.current.turns).toEqual([
        { id: MOCK_RUN_ID, prompt: 'Build a mentor platform', runId: MOCK_RUN_ID },
      ])
    })
    expect(result.current.draft).toBe('')
  })

  it('does not send a blank message', () => {
    const { result } = renderHook(() => useChat('t1'), { wrapper: TestProviders })

    act(() => {
      result.current.setDraft('   ')
    })
    act(() => {
      result.current.send()
    })

    expect(result.current.sending).toBe(false)
    expect(result.current.turns).toEqual([])
  })
})
