'use client'

import { cva, type VariantProps } from 'class-variance-authority'
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

import { usePhaseControl } from '../hooks/usePhaseControl'
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

export interface EntryViewProps<Type extends ActivityEntry['type'] = ActivityEntry['type']> {
  entry: EntryOfType<Type>
}

// The space around each entry, by its type. A message and the separators stand apart; an item under
// a phase sits close to the item before it, as the line it hangs on is the one of the content that
// holds them. A new type of entry fails to compile until it has its space.
const entryAnchorStyles = cva(
  'group/entry rounded-lg outline-none flash-chart data-[target]:animate-flash motion-reduce:animate-none',
  {
    variants: {
      type: {
        message: 'mb-10 px-1 pt-3',
        phase: 'px-1 pt-6',
        review: 'px-1 pt-6',
        note: 'py-0.5',
        tool: 'py-0.5',
        written: 'py-0.5',
        failure: 'py-0.5',
      } satisfies Record<ActivityEntry['type'], string>,
    },
  },
)

interface EntryAnchorProps extends Required<VariantProps<typeof entryAnchorStyles>> {
  entryId: string
  isTarget: boolean
  children: ReactNode
}

/** The anchor of an entry in the chat: the target of the address takes the focus and a fill that fades. */
function EntryAnchor({ entryId, isTarget, type, children }: EntryAnchorProps) {
  return (
    <div
      id={entryAnchorId(entryId)}
      tabIndex={isTarget ? -1 : undefined}
      {...(isTarget ? { 'data-target': true } : {})}
      className={entryAnchorStyles({ type })}
      style={{ animationDuration: `${String(targetFadeMs)}ms` }}
    >
      {children}
    </div>
  )
}

/** A message of the user or an agent, in the bubble of its side of the chat. */
function MessageBody({ entry }: EntryViewProps<'message'>) {
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
            <BubbleContent>
              <MessageEntry message={entry.message} projectId={projectId} runStatus={run.status} />
            </BubbleContent>
          </Bubble>
        ) : (
          <div className="text-sm leading-6">
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
  )
}

/** The separator of a phase of the work of the run. */
function PhaseBody({ entry }: EntryViewProps<'phase'>) {
  const { isOpen, onToggle } = usePhaseControl()
  return (
    <PhaseEntryView
      work={entry.work}
      stageTitle={entry.stageTitle}
      subjectTitle={entry.subjectTitle}
      isOpen={isOpen}
      onToggle={onToggle}
    />
  )
}

/** A note of a phase: what it is doing now or has found. */
function NoteBody({ entry }: EntryViewProps<'note'>) {
  return <StepNoteLine note={entry.note} inProgress={entry.isInProgress} />
}

/** What a phase wrote. */
function WrittenBody({ entry }: EntryViewProps<'written'>) {
  return <WrittenEntryView kindGroups={entry.kindGroups} />
}

/** How a phase failed. */
function FailureBody({ entry }: EntryViewProps<'failure'>) {
  return <FailureEntryView work={entry.work} />
}

/** The use of a tool, between the lines of the work that used it. */
function ToolBody({ entry }: EntryViewProps<'tool'>) {
  return <ToolUseEntryView use={entry.use} />
}

/** A review of the run that no longer waits: the line of its answer. */
function ReviewBody({ entry }: EntryViewProps<'review'>) {
  return <ReviewEntry interrupt={entry.interrupt} />
}

// How each entry of the chat shows, looked up by its type instead of branched on, so a new type
// of entry fails to compile until it has a body and a place.
const entryBodies = {
  message: MessageBody,
  phase: PhaseBody,
  note: NoteBody,
  tool: ToolBody,
  written: WrittenBody,
  failure: FailureBody,
  review: ReviewBody,
} as const satisfies {
  [Type in ActivityEntry['type']]: (props: EntryViewProps<Type>) => ReactNode
}

/** The view of an entry, chosen by its type: a message, the separator of a phase, an item under it or a review. */
export function EntryView(props: EntryViewProps) {
  const { entry } = props
  const { targetEntryId } = useRunActivity()
  const Body = entryBodies[entry.type] as (props: EntryViewProps) => ReactNode
  return (
    <EntryAnchor entryId={entry.id} isTarget={targetEntryId === entry.id} type={entry.type}>
      <Body {...props} />
    </EntryAnchor>
  )
}
