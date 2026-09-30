import { useMutation } from '@tanstack/react-query'
import { SendIcon } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

import { createRun } from '../chat.api'
import type { ChatTurn } from '../chat.types'
import { AssistantMessage } from './AssistantMessage'

interface ChatPageProps {
  threadId: string
}

export function ChatPage({ threadId }: ChatPageProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')

  const startRun = useMutation({
    mutationFn: (prompt: string) => createRun(threadId, prompt),
    onSuccess: ({ run_id }, prompt) => {
      setTurns((previous) => [...previous, { id: run_id, prompt, runId: run_id }])
      setDraft('')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const prompt = draft.trim()
    if (prompt !== '') startRun.mutate(prompt)
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ol className="mx-auto flex max-w-3xl flex-col gap-6 p-4" aria-label="Messages">
          {turns.map((turn) => (
            <li key={turn.id} className="flex flex-col gap-3">
              <p className="self-end rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap">
                {turn.prompt}
              </p>
              <AssistantMessage runId={turn.runId} />
            </li>
          ))}
        </ol>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl gap-2 p-4">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <Textarea
          id="chat-input"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          placeholder="Give the agents a task..."
          rows={2}
          className="resize-none"
        />
        <Button type="submit" size="icon" disabled={startRun.isPending} aria-label="Send">
          <SendIcon aria-hidden />
        </Button>
      </form>
    </div>
  )
}
