'use client'

import { cn } from 'cn'
import { FileTextIcon, TextIcon } from 'lucide-react'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { useState } from 'react'

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
import { Button } from '@/shared/components/ui/button'
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

/** A document or an item that a message of an agent names. */
type Reference =
  | { type: 'artifact'; id: string; title: string; version: number }
  | { type: 'item'; id: string; key: string; version: number }

/**
 * The documents and the items that a message of an agent names, as cards that open them. One card
 * shows as it is. With more, only the first shows, with a button over its end that says how many
 * more there are; the button opens them all as short rows, and the same place closes them.
 */
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
  const [isExpanded, setIsExpanded] = useState(false)
  const references: Reference[] = [
    ...message.artifact_refs.map(({ artifact_id, title, version }): Reference => ({
      type: 'artifact',
      id: artifact_id,
      title,
      version,
    })),
    ...message.item_refs.map(({ item_id, key, version }): Reference => ({
      type: 'item',
      id: item_id,
      key,
      version,
    })),
  ]
  const [first, ...others] = references
  if (first === undefined) return null

  if (others.length === 0) {
    return (
      <div className="flex w-full flex-col">
        <RefCard reference={first} projectId={projectId} openPage={openPage} />
      </div>
    )
  }
  if (!isExpanded) {
    return (
      <div className="relative w-full">
        <RefCard reference={first} projectId={projectId} openPage={openPage} hasButton />
        <Button
          variant="text"
          size="xs"
          aria-expanded={false}
          className="absolute inset-y-0 right-2 z-10 my-auto"
          onClick={() => {
            setIsExpanded(true)
          }}
        >
          {activityChatMessages.moreReferences(others.length)}
        </Button>
      </div>
    )
  }
  return (
    <div className="flex w-full flex-col gap-1">
      {references.map((reference) => (
        <RefCard
          key={`${reference.type}:${reference.id}`}
          reference={reference}
          projectId={projectId}
          openPage={openPage}
          isCompact
        />
      ))}
      <Button
        variant="text"
        size="xs"
        aria-expanded
        className="self-start px-0"
        onClick={() => {
          setIsExpanded(false)
        }}
      >
        {activityChatMessages.fewerReferences}
      </Button>
    </div>
  )
}

interface RefCardProps {
  reference: Reference
  projectId: string
  openPage: (href: Route) => void
  /** A short row, without its mark, for a list of many. */
  isCompact?: boolean
  /** Room at its end for the button over it. */
  hasButton?: boolean
}

/** A card of a document or an item that a message names, which opens it. */
function RefCard(props: RefCardProps) {
  return props.reference.type === 'artifact' ? (
    <ArtifactRefCard {...props} reference={props.reference} />
  ) : (
    <ItemRefCard {...props} reference={props.reference} />
  )
}

/** The card of a reference: full, or a short row of its title and what it is on one line. */
function RefCardFrame({
  isCompact = false,
  hasButton = false,
  label,
  onOpen,
  mark,
  title,
  description,
}: {
  isCompact?: boolean | undefined
  hasButton?: boolean | undefined
  label: string
  onOpen: () => void
  mark: ReactNode
  title: string
  description: string
}) {
  return (
    <Attachment
      size={isCompact ? 'xs' : 'sm'}
      className={cn('w-full', hasButton && 'has-data-[slot=attachment-content]:pr-24')}
    >
      <AttachmentTrigger aria-label={label} onClick={onOpen} />
      {!isCompact && <AttachmentMedia>{mark}</AttachmentMedia>}
      <AttachmentContent className={cn(isCompact && 'flex items-baseline gap-2')}>
        <AttachmentTitle>{title}</AttachmentTitle>
        <AttachmentDescription className={cn(isCompact && 'mt-0 shrink-0')}>
          {description}
        </AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  )
}

/** A document that a message names, as a card that opens it. */
function ArtifactRefCard({
  reference,
  projectId,
  openPage,
  isCompact,
  hasButton,
}: Omit<RefCardProps, 'reference'> & { reference: Extract<Reference, { type: 'artifact' }> }) {
  return (
    <RefCardFrame
      isCompact={isCompact}
      hasButton={hasButton}
      label={`${reference.title}, ${activityChatMessages.version(reference.version)}`}
      onOpen={() => {
        openPage(routes.project(projectId).document(reference.id))
      }}
      mark={<FileTextIcon aria-hidden />}
      title={reference.title}
      description={activityChatMessages.version(reference.version)}
    />
  )
}

/** An item that a message names, as a card that opens it; its title reads from the item itself. */
function ItemRefCard({
  reference,
  projectId,
  openPage,
  isCompact,
  hasButton,
}: Omit<RefCardProps, 'reference'> & { reference: Extract<Reference, { type: 'item' }> }) {
  const item = useItem(reference.id, reference.version)
  const { schema } = useItemSchema(item.data)
  return (
    <RefCardFrame
      isCompact={isCompact}
      hasButton={hasButton}
      label={activityChatMessages.quickLook(reference.key)}
      onOpen={() => {
        openPage(routes.project(projectId).item(reference.id))
      }}
      mark={<TextIcon aria-hidden />}
      title={item.data === undefined ? reference.key : itemTitle(schema, item.data)}
      description={
        schema === undefined
          ? activityChatMessages.version(reference.version)
          : activityChatMessages.itemMeta(schema.title, reference.key, reference.version)
      }
    />
  )
}
