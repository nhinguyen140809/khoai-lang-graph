import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { startedRunId } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useChat } from '../useChat'
import { blankDrafts, sentDraftCases } from './useChat.data'

function typeAndSend(draft: string) {
  const { result } = renderHookWithProviders(() => useChat('t1'))
  act(() => {
    result.current.setDraft(draft)
  })
  act(() => {
    result.current.send()
  })
  return result
}

describe('useChat', () => {
  it.each(sentDraftCases)(
    'starts a run with $draft as $prompt, then adds its turn and clears the message',
    async ({ draft, prompt }) => {
      const result = typeAndSend(draft)

      await waitFor(() => {
        expect(result.current.turns).toEqual([{ id: startedRunId, prompt, runId: startedRunId }])
      })
      expect(result.current.draft).toBe('')
    },
  )

  it.each(blankDrafts)('does not send the blank message %j', (draft) => {
    const result = typeAndSend(draft)

    expect(result.current.sending).toBe(false)
    expect(result.current.turns).toEqual([])
  })
})
