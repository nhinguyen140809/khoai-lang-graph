'use client'

import { ArrowUpIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Textarea } from '@/shared/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { useActivity } from '../hooks/useActivity'
import { ActivityEntry } from './ActivityEntry'
import { CopyEntryAction } from './CopyEntryAction'
import { RunEntry } from './RunEntry'

interface ActivityPageProps {
  threadId: string
}

export function ActivityPage({ threadId }: ActivityPageProps) {
  const { turns, draft, setDraft, send, sending } = useActivity(threadId)

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ol className="mx-auto flex max-w-3xl flex-col gap-2 p-4" aria-label="Activity">
          {turns.map((turn) => (
            <li key={turn.id} className="flex flex-col gap-2">
              <ActivityEntry author="user" actions={<CopyEntryAction text={turn.prompt} />}>
                <p className="whitespace-pre-wrap">{turn.prompt}</p>
              </ActivityEntry>
              <RunEntry runId={turn.runId} />
            </li>
          ))}
        </ol>
      </ScrollArea>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
        className="mx-auto flex w-full max-w-3xl gap-2 p-4"
      >
        <label htmlFor="activity-input" className="sr-only">
          Message
        </label>
        <Textarea
          id="activity-input"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          placeholder="Give the agents a task..."
          rows={2}
          className="resize-none"
        />
        {/* An arrow up, as the prompt of the project list sends its idea; its name is in the
            tooltip. It waits for a message, and while the last one is sent. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              size="icon"
              disabled={sending || draft.trim() === ''}
              aria-label="Send"
            >
              <ArrowUpIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send</TooltipContent>
        </Tooltip>
      </form>
    </div>
  )
}
