import { useState } from 'react'

import { useStartRun } from '@/modules/run/features/start'

import type { ActivityTurn } from '../activity.types'

/**
 * The turns of the activity and the message being written. `send` starts a run with the message, then
 * adds its turn and clears the message; a blank message is not sent.
 */
export function useActivity(threadId: string) {
  const [turns, setTurns] = useState<ActivityTurn[]>([])
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
