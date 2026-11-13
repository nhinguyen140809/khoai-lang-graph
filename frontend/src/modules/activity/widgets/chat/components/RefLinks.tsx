'use client'

import { ChevronRightIcon } from 'lucide-react'
import type { Route } from 'next'

import { useOpenPage } from '@/shared/components/frame'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/shared/components/ui/attachment'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'

import { activityChatMessages } from '../activity-chat.constants'
import { useRefLook } from '../hooks/useRefLook'
import type { Reference } from '../ref-links.types'
import { RowButton } from './RowButton'

interface RefLinksProps {
  message: {
    artifact_refs: { artifact_id: string; title: string; version: number }[]
    item_refs: { item_id: string; key: string; version: number }[]
  }
  projectId: string
}

/**
 * The documents and the items that a message of an agent names. The first stays on show as a
 * card that opens it. The others wait in one box under it, whose first row says how many there
 * are and opens and closes the rest, a row for each, so that they read as one group.
 */
export function RefLinks({ message, projectId }: RefLinksProps) {
  const openPage = useOpenPage()
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

  return (
    <div className="flex w-full animate-in flex-col gap-2 duration-300 fade-in-0 motion-reduce:animate-none">
      <RefCard reference={first} projectId={projectId} openPage={openPage} />
      {others.length > 0 && (
        <Collapsible className="rounded-xl border bg-card p-1.5">
          <CollapsibleTrigger asChild>
            <RowButton className="group/more text-muted-foreground aria-expanded:bg-transparent hover:aria-expanded:bg-(--tone-soft)">
              <ChevronRightIcon
                aria-hidden
                className="size-4 shrink-0 transition-transform group-aria-expanded/more:rotate-90"
              />
              {activityChatMessages.moreReferences(others.length)}
            </RowButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col">
              {others.map((reference) => (
                <RefRow
                  key={`${reference.type}:${reference.id}`}
                  reference={reference}
                  projectId={projectId}
                  openPage={openPage}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

interface RefProps {
  reference: Reference
  projectId: string
  openPage: (href: Route) => void
}

/** A card of a document or an item that a message names, which opens it. */
function RefCard(props: RefProps) {
  const look = useRefLook(props.reference, props.projectId)
  return (
    <Attachment size="default" className="w-full">
      <AttachmentTrigger
        aria-label={look.label}
        onClick={() => {
          props.openPage(look.href)
        }}
      />
      <AttachmentMedia className="w-12">
        <look.Mark aria-hidden className="size-5" />
      </AttachmentMedia>
      <AttachmentContent className="flex flex-col justify-center gap-0.5">
        <AttachmentTitle className="text-sm">{look.title}</AttachmentTitle>
        <AttachmentDescription className="mt-0 text-xs">{look.description}</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  )
}

/** A row of the list of the others: a ghost button as tall as it needs, so the rows need no gap. */
function RefRow(props: RefProps) {
  const look = useRefLook(props.reference, props.projectId)
  return (
    <RowButton
      aria-label={look.label}
      onClick={() => {
        props.openPage(look.href)
      }}
    >
      <look.Mark aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate text-sm font-medium">{look.title}</span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{look.description}</span>
    </RowButton>
  )
}
