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
import { RelativeTime } from '@/shared/components/ui/relative-time'
import { toneClasses } from '@/shared/lib/tone'

import { useRunActivity } from '../hooks/useRunActivity'
import { FailureEntryView } from './FailureEntryView'
import { MessageEntry } from './MessageEntry'
import { PhaseEntryView } from './PhaseEntryView'
import { ResendButton } from './ResendButton'
import { ReviewEntry } from './ReviewEntry'
import { StepNoteLine } from './StepNoteLine'
import { ToolUseEntryView } from './ToolUseEntryView'
import { WrittenEntryView } from './WrittenEntryView'

type EntryOfType<Type extends ActivityEntry['type']> = Extract<ActivityEntry, { type: Type }>

/** How the reader opens and closes a phase of work: whether it shows its items, and the switch. */
export interface PhaseControl {
  isOpen: boolean
  onToggle: () => void
}

interface EntryViewProps<Type extends ActivityEntry['type'] = ActivityEntry['type']> {
  entry: EntryOfType<Type>
  isTarget: boolean
  /** Given to the separator of a phase, which opens and closes the items under it. */
  phase?: PhaseControl | undefined
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
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className="mb-10 px-1 pt-3">
      <Message align={align}>
        {/* The role, the words and the documents of a message are one group with one gap, smaller than
            the gap between the entries of the chat, so that the group reads as one. The words have
            room above their first line that the small name above them has not, so the name sits
            closer by that much, and the two spaces look the same. */}
        <MessageContent className="gap-2">
          {isAgent && roleLabel !== null && (
            <MessageHeader className={cn('px-0 text-(--tone-strong)', toneClasses.chart)}>
              {roleLabel}
            </MessageHeader>
          )}
          {isUser ? (
            <Bubble variant={bubbleLook} align="end">
              <BubbleContent className="px-4 py-2.5 text-base leading-7">
                <MessageEntry
                  message={entry.message}
                  projectId={projectId}
                  runStatus={run.status}
                />
              </BubbleContent>
            </Bubble>
          ) : (
            <div className="text-base leading-7">
              <MessageEntry message={entry.message} projectId={projectId} runStatus={run.status} />
            </div>
          )}
          {/* The time, the resend and the copy of the words hang under the message, in the space
              below the entry, where the reading ends. They take no height inside the entry, so the
              fill of the target stops at the words. */}
          <MessageFooter
            className={cn(
              'absolute top-full gap-1.5 px-0 pt-1.5 opacity-0 transition-opacity group-focus-within/entry:opacity-100 group-hover/entry:opacity-100 pointer-coarse:opacity-100',
              isUser ? 'right-0' : 'left-0 flex-row-reverse',
            )}
          >
            <RelativeTime
              date={entry.time}
              className="px-1 text-xs font-normal text-muted-foreground"
            />
            {isNeverRead(entry.message, run.status) && thread !== null && (
              <ResendButton
                content={entry.message.content}
                projectId={projectId}
                thread={thread}
                display="icon"
              />
            )}
            <CopyButton value={entry.message.content} display="icon" size="icon-sm" />
          </MessageFooter>
        </MessageContent>
      </Message>
    </EntryAnchor>
  )
}

/** The separator of a phase of the work of the run. */
function PhaseView({ entry, isTarget, phase }: EntryViewProps<'phase'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className="px-1 pt-4 pb-1">
      <PhaseEntryView
        work={entry.work}
        stageTitle={entry.stageTitle}
        subjectTitle={entry.subjectTitle}
        isOpen={phase?.isOpen ?? true}
        onToggle={phase?.onToggle ?? (() => undefined)}
      />
    </EntryAnchor>
  )
}

// An item under a phase sits a little in from its separator and close to the item before it.
const itemClassName = 'py-0.5 pr-1 pl-5'

/** A note of a phase: what it is doing now or has found. */
function NoteView({ entry, isTarget }: EntryViewProps<'note'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className={itemClassName}>
      <StepNoteLine note={entry.note} inProgress={entry.isInProgress} />
    </EntryAnchor>
  )
}

/** What a phase wrote. */
function WrittenView({ entry, isTarget }: EntryViewProps<'written'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className={itemClassName}>
      <WrittenEntryView kindGroups={entry.kindGroups} />
    </EntryAnchor>
  )
}

/** How a phase failed. */
function FailureView({ entry, isTarget }: EntryViewProps<'failure'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className={itemClassName}>
      <FailureEntryView work={entry.work} />
    </EntryAnchor>
  )
}

/** The use of a tool, between the lines of the work that used it. */
function ToolView({ entry, isTarget }: EntryViewProps<'tool'>) {
  return (
    <EntryAnchor entryId={entry.id} isTarget={isTarget} className={itemClassName}>
      <ToolUseEntryView use={entry.use} />
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
  phase: PhaseView,
  note: NoteView,
  tool: ToolView,
  written: WrittenView,
  failure: FailureView,
  review: ReviewView,
} as const satisfies {
  [Type in ActivityEntry['type']]: (props: EntryViewProps<Type>) => ReactNode
}

/** The view of an entry, chosen by its type: a message, the separator of a phase, an item under it or a review. */
export function EntryView(props: EntryViewProps) {
  const View = entryViews[props.entry.type] as (props: EntryViewProps) => ReactNode
  return <View {...props} />
}
