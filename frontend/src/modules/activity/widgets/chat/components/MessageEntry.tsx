'use client'

import type { ReactNode } from 'react'

import type { ActivityEntry } from '@/modules/activity/entities'
import type { RunStatus } from '@/modules/run/entities'
import { type MessageAuthor, messageDeliveryNote } from '@/modules/thread/entities'
import { Markdown } from '@/shared/components/ui/markdown'

import { RefLinks } from './RefLinks'

interface MessageEntryProps {
  message: Extract<ActivityEntry, { type: 'message' }>['message']
  projectId: string
  runStatus: RunStatus | null
}

/** The words of the user: plain text, with the note of when the agents read them. */
function UserWords({ message, runStatus }: MessageEntryProps) {
  return (
    <>
      <p className="whitespace-pre-wrap">{message.content}</p>
      <DeliveryNote message={message} runStatus={runStatus} />
    </>
  )
}

/** The words of an agent: Markdown, with the documents and the items it names as cards. */
function AgentWords({ message, projectId }: MessageEntryProps) {
  return (
    <>
      <Markdown>{message.content}</Markdown>
      <RefLinks message={message} projectId={projectId} />
    </>
  )
}

/** The words of the app: muted plain text. */
function SystemWords({ message }: MessageEntryProps) {
  return <p className="text-muted-foreground">{message.content}</p>
}

// How the words of a message read, looked up by who says them instead of branched on, so a new
// kind of author fails to compile until it has words.
const authorWords = {
  user: UserWords,
  agent: AgentWords,
  system: SystemWords,
} as const satisfies Record<MessageAuthor, (props: MessageEntryProps) => ReactNode>

/** A message of the chat: of the user, of an agent or of the app. */
export function MessageEntry({ message, projectId, runStatus }: MessageEntryProps) {
  const Words = authorWords[message.author]
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Words message={message} projectId={projectId} runStatus={runStatus} />
    </div>
  )
}

/** The note under a message of the user about when the agents read it. */
function DeliveryNote({
  message,
  runStatus,
}: {
  message: { delivery: 'pending' | 'delivered' | 'started_run' | 'undelivered' | null }
  runStatus: RunStatus | null
}) {
  const note = messageDeliveryNote(message, runStatus)
  if (note === null) return null
  return <p className="text-xs text-muted-foreground">{note.user}</p>
}
