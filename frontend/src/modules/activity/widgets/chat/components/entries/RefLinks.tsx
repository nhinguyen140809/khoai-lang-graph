'use client'

import { ChevronRightIcon } from 'lucide-react'

import { type ChatReference, useReferenceOpener } from '@/modules/activity/entities'
import { AgentFace } from '@/shared/components/face'
import { Thumbnail, thumbnailIcons } from '@/shared/components/thumbnail'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'

import { activityChatMessages } from '../../activity-chat.constants'
import { useRefLook } from '../../hooks/useRefLook'
import type { Reference } from '../../ref-links.types'
import { RowButton } from './RowButton'

interface RefLinksProps {
  message: {
    agent_role: string | null
    artifact_refs: { artifact_id: string; kind: string; title: string; version: number }[]
    item_refs: { item_id: string; key: string; version: number }[]
  }
}

/**
 * The documents and the items that a message of an agent names. The first stays on show as a
 * card that opens it. The others wait in one box under it, whose first row says how many there
 * are and opens and closes the rest, a row for each, so that they read as one group.
 */
export function RefLinks({ message }: RefLinksProps) {
  const references: Reference[] = [
    ...message.artifact_refs.map(({ artifact_id, kind, title, version }): Reference => ({
      type: 'artifact',
      id: artifact_id,
      kind,
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
      <RefCard reference={first} agentRole={message.agent_role} />
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
                <RefRow key={`${reference.type}:${reference.id}`} reference={reference} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

/** What the chat opens for a reference of a message. */
function chatReferenceOf(reference: Reference): ChatReference {
  return reference.type === 'artifact'
    ? { kind: 'document', artifactId: reference.id }
    : { kind: 'item', itemId: reference.id }
}

/**
 * A card of a document or an item that a message names, which opens it where the page says. Its
 * mark is the one the Documents panel shows for that kind, drawn large on a tile of its own, and the
 * agent that named it stands at its side, so the card reads as something an agent handed over.
 */
function RefCard({ reference, agentRole }: { reference: Reference; agentRole: string | null }) {
  const look = useRefLook(reference)
  const open = useReferenceOpener(chatReferenceOf(reference))
  const drawing = (
    <span className="relative block">
      <Thumbnail look={look.look} title={look.title} icon={look.icon} seed={look.seed} />
      {/* The version rides on the drawing itself, where the eye meets it with the kind. */}
      <span className="absolute top-1.5 right-1.5 rounded-md bg-background/75 px-1.5 py-0.5 text-3xs font-semibold text-foreground tabular-nums shadow-xs">
        v{reference.version}
      </span>
    </span>
  )
  return (
    <div className="flex w-full agent-card-sway items-start justify-center gap-3">
      {/* The agent leans after the folder once it has pushed it, and stays with it. */}
      {agentRole !== null && (
        <AgentFace seed={agentRole} size="default" className="mt-1 shrink-0 agent-push" />
      )}
      <div className="w-40 shrink-0">
        {/* The entrance is the push: the folder comes in from the agent's side and stops here. */}
        <div className="animate-folder-in motion-reduce:animate-none">
          <div className="relative">
            {open === null ? (
              <div aria-disabled className="opacity-60">
                {drawing}
              </div>
            ) : (
              <button
                type="button"
                aria-label={look.label}
                onClick={open}
                className="block w-full rounded-lg text-left transition-transform duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0"
              >
                {drawing}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The mark of a row: the icon of the kind, in the size a row holds. */
function RowMark({ name }: { name: string | null }) {
  if (name === null) return <span aria-hidden className="size-4 shrink-0" />
  const Icon = thumbnailIcons[name]
  if (Icon === undefined) return <span aria-hidden className="size-4 shrink-0" />
  return <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
}

/** A row of the list of the others: a ghost button as tall as it needs, so the rows need no gap. */
function RefRow({ reference }: { reference: Reference }) {
  const look = useRefLook(reference)
  const open = useReferenceOpener(chatReferenceOf(reference))
  return (
    <RowButton aria-label={look.label} disabled={open === null} onClick={open ?? undefined}>
      <RowMark name={look.icon} />
      <span className="min-w-0 truncate text-sm font-medium">{look.title}</span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{look.description}</span>
    </RowButton>
  )
}
