import { useState } from 'react'

import type { ChatTurn } from '../chat.types'
import { useStartRun } from './useStartRun'

/**
 * The turns of the chat and the message being written. `send` starts a run with the message, then
 * adds its turn and clears the message; a blank message is not sent.
 */
export function useChat(threadId: string) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')
  const startRun = useStartRun(threadId)

  const send = () => {
    const prompt = draft.trim()
    if (prompt === '') return
    startRun.mutate(prompt, {
      onSuccess: ({ run_id }) => {
        setTurns((previous) => [...previous, { id: run_id, prompt, runId: run_id }])
        setDraft('')
      },
    })
  }

  return { turns, draft, setDraft, send, sending: startRun.isPending }
}
