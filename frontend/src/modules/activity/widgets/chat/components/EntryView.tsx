'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import type { ActivityEntry } from '@/modules/activity/entities'
import { entryAnchorId } from '@/modules/activity/entities'
import { isNeverRead, messageAuthorLooks, messageBubbleLooks } from '@/modules/thread/entities'
import { useAgentRoleLabels } from '@/modules/workflow/entities'
import { targetFadeMs } from '@/shared/components/feed'
import { Bubble, BubbleContent } from '@/shared/components/ui/bubble'
import { CopyButton } from '@/shared/components/ui/copy-button'
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/shared/components/ui/message'
import { toneClasses } from '@/shared/lib/tone'

import { useRunActivity } from '../hooks/useRunActivity'
import { MessageEntry } from './MessageEntry'
import { ResendButton } from './ResendButton'
import { ReviewEntry } from './ReviewEntry'
import { WorkEntryView } from './WorkEntryView'

type EntryOfType<Type extends ActivityEntry['type']> = Extract<ActivityEntry, { type: Type }>

interface EntryViewProps<Type extends ActivityEntry['type'] = ActivityEntry['type']> {
  entry: EntryOfType<Type>
  isTarget: boolean
}

interface EntryAnchorProps {
  entryId: string
  isTarget: boolean
  className?: string | undefined
  children: ReactNode
}

/** The anchor of an entry in the chat: the target of the address takes the focus and a fill that fades. */
function EntryAnchor({ entryId, isTarget, className, children }: EntryAnchorProps) {
  return (
    <div
      id={entryAnchorId(entryId)}
      tabIndex={isTarget ? -1 : undefined}
      {...(isTarget ? { 'data-target': true } : {})}
      className={cn(
        'group/entry rounded-lg outline-none data-[target]:animate-flash motion-reduce:animate-none',
        'flash-chart',
        className,
      )}
      style={{ animationDuration: `${String(targetFadeMs)}ms` }}
    >
      {children}
    </div>
  )
}

/** A message of the user or an agent, in the bubble of its side of the chat. */
function MessageView({ entry, isTarget }: EntryViewProps<'message'>) {
  const { run, thread, projectId } = useRunActivity()
  const author = messageAuthorLooks[entry.message.author]
  const isUser = author.isUser
  const isAgent = author.isAgent
  const roleLabels = useAgentRoleLabels(run.workflow_version)
  const roleLabel =
    entry.message.agent_role === null
      ? null
      : (roleLabels.get(entry.message.agent_role) ?? entry.message.agent_role)
  const align = isUser ? 'end' : 'start'
  const bubbleLook = messageBubbleLooks[entry.message.delivery ?? 'delivered']

  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className="mb-5 px-1 pt-1.5">
      <Message align={align}>
        <MessageContent>
          {isAgent && roleLabel !== null && (
            <MessageHeader className={cn('px-0 text-(--tone-strong)', toneClasses.chart)}>
              {roleLabel}
            </MessageHeader>
          )}
          {isUser ? (
            <Bubble variant={bubbleLook} align="end">
              <BubbleContent>
                <MessageEntry
                  message={entry.message}
                  projectId={projectId}
                  runStatus={run.status}
                />
              </BubbleContent>
            </Bubble>
          ) : (
            <div className="text-sm leading-6">
              <MessageEntry message={entry.message} projectId={projectId} runStatus={run.status} />
            </div>
          )}
          {/* The copy of the words hangs under the message, in the space below the entry, where the
              reading ends. It takes no height inside the entry, so the fill of the target stops at
              the words. */}
          <MessageFooter
            className={cn(
              'absolute top-full px-0 opacity-0 transition-opacity group-focus-within/entry:opacity-100 group-hover/entry:opacity-100 pointer-coarse:opacity-100',
              isUser ? 'right-0' : 'left-0',
            )}
          >
            {isNeverRead(entry.message, run.status) && thread !== null && (
              <ResendButton
                content={entry.message.content}
                projectId={projectId}
                thread={thread}
                display="icon"
              />
            )}
            <CopyButton
              value={entry.message.content}
              display="icon"
              size="icon-xs"
              className="size-4"
            />
          </MessageFooter>
        </MessageContent>
      </Message>
    </EntryAnchor>
  )
}

/** A line of the work of the run. */
function WorkView({ entry, isTarget }: EntryViewProps<'work'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className="px-1 py-1.5">
      <WorkEntryView
        work={entry.work}
        stageTitle={entry.stageTitle}
        subjectTitle={entry.subjectTitle}
        kindGroups={entry.kindGroups}
      />
    </EntryAnchor>
  )
}

/** A review of the run that no longer waits: the line of its answer. */
function ReviewView({ entry, isTarget }: EntryViewProps<'review'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className="px-1 py-1.5">
      <ReviewEntry interrupt={entry.interrupt} />
    </EntryAnchor>
  )
}

// How each entry of the chat shows, looked up by its type instead of branched on, so a new type
// of entry fails to compile until it has a view.
const entryViews = {
  message: MessageView,
  work: WorkView,
  review: ReviewView,
} as const satisfies {
  [Type in ActivityEntry['type']]: (props: EntryViewProps<Type>) => ReactNode
}

/** The view of an entry, chosen by its type: a message, a line of work or a review. */
export function EntryView(props: EntryViewProps) {
  const View = entryViews[props.entry.type] as (props: EntryViewProps) => ReactNode
  return <View {...props} />
}
