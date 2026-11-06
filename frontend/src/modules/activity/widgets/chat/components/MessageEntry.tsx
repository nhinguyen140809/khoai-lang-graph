'use client'

import { FileTextIcon, TextIcon } from 'lucide-react'
import type { Route } from 'next'
import type { ReactNode } from 'react'

import type { ActivityEntry } from '@/modules/activity/entities'
import { useItem, useItemSchema } from '@/modules/artifact/entities'
import type { RunStatus } from '@/modules/run/entities'
import { type MessageAuthor, messageDeliveryNote } from '@/modules/thread/entities'
import { itemTitle } from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/shared/components/ui/attachment'
import { Markdown } from '@/shared/components/ui/markdown'
import { routes } from '@/shared/routes'

import { activityChatMessages } from '../activity-chat.constants'

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
  const openPage = useOpenPage()
  return (
    <>
      <Markdown>{message.content}</Markdown>
      <RefLinks message={message} projectId={projectId} openPage={openPage} />
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
    <div className="flex min-w-0 flex-col gap-1">
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

/** The documents and the items that a message of an agent names, as cards that open them. */
function RefLinks({
  message,
  projectId,
  openPage,
}: {
  message: {
    artifact_refs: { artifact_id: string; title: string; version: number }[]
    item_refs: { item_id: string; key: string; version: number }[]
  }
  projectId: string
  openPage: (href: Route) => void
}) {
  if (message.artifact_refs.length === 0 && message.item_refs.length === 0) return null
  return (
    <div className="flex w-full flex-col gap-2">
      {message.artifact_refs.map((reference) => (
        <ArtifactRefCard
          key={reference.artifact_id}
          reference={reference}
          projectId={projectId}
          openPage={openPage}
        />
      ))}
      {message.item_refs.map((reference) => (
        <ItemRefCard
          key={reference.item_id}
          reference={reference}
          projectId={projectId}
          openPage={openPage}
        />
      ))}
    </div>
  )
}

/** A document that a message names, as a card that opens it. */
function ArtifactRefCard({
  reference,
  projectId,
  openPage,
}: {
  reference: { artifact_id: string; title: string; version: number }
  projectId: string
  openPage: (href: Route) => void
}) {
  return (
    <Attachment size="sm" className="w-full">
      <AttachmentTrigger
        aria-label={`${reference.title}, ${activityChatMessages.version(reference.version)}`}
        onClick={() => {
          openPage(routes.project(projectId).document(reference.artifact_id))
        }}
      />
      <AttachmentMedia>
        <FileTextIcon aria-hidden />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{reference.title}</AttachmentTitle>
        <AttachmentDescription>
          {activityChatMessages.version(reference.version)}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  )
}

/** An item that a message names, as a card that opens it; its title reads from the item itself. */
function ItemRefCard({
  reference,
  projectId,
  openPage,
}: {
  reference: { item_id: string; key: string; version: number }
  projectId: string
  openPage: (href: Route) => void
}) {
  const item = useItem(reference.item_id, reference.version)
  const { schema } = useItemSchema(item.data)
  return (
    <Attachment size="sm" className="w-full">
      <AttachmentTrigger
        aria-label={activityChatMessages.quickLook(reference.key)}
        onClick={() => {
          openPage(routes.project(projectId).item(reference.item_id))
        }}
      />
      <AttachmentMedia>
        <TextIcon aria-hidden />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>
          {item.data === undefined ? reference.key : itemTitle(schema, item.data)}
        </AttachmentTitle>
        <AttachmentDescription>
          {schema === undefined
            ? activityChatMessages.version(reference.version)
            : activityChatMessages.itemMeta(schema.title, reference.key, reference.version)}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  )
}
