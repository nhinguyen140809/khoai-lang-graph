'use client'

import { SendIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Textarea } from '@/shared/components/ui/textarea'

import { useChat } from '../useChat'
import { AssistantMessage } from './AssistantMessage'

interface ChatPageProps {
  threadId: string
}

export function ChatPage({ threadId }: ChatPageProps) {
  const chat = useChat(threadId)

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ol className="mx-auto flex max-w-3xl flex-col gap-6 p-4" aria-label="Messages">
          {chat.turns.map((turn) => (
            <li key={turn.id} className="flex flex-col gap-3">
              <p className="self-end rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap">
                {turn.prompt}
              </p>
              <AssistantMessage runId={turn.runId} />
            </li>
          ))}
        </ol>
      </ScrollArea>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          chat.send()
        }}
        className="mx-auto flex w-full max-w-3xl gap-2 p-4"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <Textarea
          id="chat-input"
          value={chat.draft}
          onChange={(event) => {
            chat.setDraft(event.target.value)
          }}
          placeholder="Give the agents a task..."
          rows={2}
          className="resize-none"
        />
        <Button type="submit" size="icon" disabled={chat.sending} aria-label="Send">
          <SendIcon aria-hidden />
        </Button>
      </form>
    </div>
  )
}
