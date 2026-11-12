'use client'

import { cn } from 'cn'
import { ActivityIcon } from 'lucide-react'
import { type ComponentProps, Suspense, useMemo } from 'react'

import {
  entryAnchorId,
  messagesByRun,
  useActivityStream,
  useActivityThread,
} from '@/modules/activity/entities'
import { usePendingInterrupt } from '@/modules/review/entities'
import { type Run, useLatestRun, useThreadRuns } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'
import { useThreadMessages } from '@/modules/thread/entities'
import { useEditorTab } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Bubble, BubbleContent } from '@/shared/components/ui/bubble'
import { Message as MessageRow, MessageContent } from '@/shared/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/shared/components/ui/message-scroller'
import { useKeptScroll } from '@/shared/lib/memory'
import { useScrollIntoViewById } from '@/shared/lib/viewport'
import { RouteParam, routes, useRouteParam } from '@/shared/routes'

import { activityChatMessages } from '../activity-chat.constants'
import type { ChatState } from '../chat-state.types'
import { chatStateOf } from '../chat-state.utils'
import { ActivityPrompt } from './ActivityPrompt'
import { PendingReview } from './PendingReview'
import { RunActivity } from './RunActivity'

/** The messages of a run without any; one list, so that its entries do not compute again. */
const EMPTY_MESSAGES: Message[] = []

/** The column of the chat: wide enough to read in comfort, with room at its sides. */
function ChatColumn({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-4xl px-6', className)} {...props} />
}

interface ActivityPageProps {
  projectId: string
}

/** The chat of the activity of a project: its runs one after another, and the prompt under them. */
export function ActivityPage({ projectId }: ActivityPageProps) {
  useEditorTab({
    id: 'activity',
    title: activityChatMessages.tabTitle,
    href: routes.project(projectId).activity(),
  })
  const thread = useActivityThread(projectId)
  const isPending = thread.state === 'pending'
  const threadId = thread.state === 'success' ? thread.thread?.id : undefined

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isPending && <ChatLoading />}
      {thread.state === 'error' && (
        <ErrorState
          message={activityChatMessages.loadError}
          onRetry={() => {
            thread.retry()
          }}
        />
      )}
      {thread.state === 'success' && (
        <Suspense fallback={null}>
          <ActivityChat projectId={projectId} thread={thread.thread} threadId={threadId ?? null} />
        </Suspense>
      )}
    </div>
  )
}

/** The chat of a thread: its runs with their entries, and the prompt that sends to it. */
function ActivityChat({
  projectId,
  thread,
  threadId,
}: {
  projectId: string
  thread: Thread | null
  threadId: string | null
}) {
  const runs = useThreadRuns(threadId ?? '', { isEnabled: threadId !== null })
  const messages = useThreadMessages(threadId ?? '', { isEnabled: threadId !== null })
  const latestRun = useLatestRun(threadId ?? '', { isEnabled: threadId !== null })
  const runOnScreen = latestRun.data ?? null
  useActivityStream(runOnScreen, threadId ?? '')
  const pendingReview =
    usePendingInterrupt(runOnScreen?.id ?? '', {
      isEnabled: runOnScreen !== null,
      runStatus: runOnScreen?.status,
    }).data ?? null

  const keptScroll = useKeptScroll('chat', { from: 'end' })
  const target = useRouteParam(RouteParam.Entry)
  const runIds = (runs.data?.pages ?? [])
    .flatMap(({ items }) => items)
    .toSorted((a, b) => a.number - b.number)
  const byRun = useMemo(
    () =>
      messages.data === undefined
        ? new Map<string | null, Message[]>()
        : messagesByRun(messages.data.pages.flatMap(({ items }) => items)),
    [messages.data],
  )
  const state = chatStateOf({
    hasThread: thread !== null,
    isPending: runs.isPending || messages.isPending,
    isError: runs.isError || messages.isError,
    hasActivity: runIds.length > 0 || (byRun.get(null) ?? EMPTY_MESSAGES).length > 0,
  })
  const isEmpty = state === 'empty'

  return (
    <>
      <ChatBody
        state={state}
        runs={runIds}
        byRun={byRun}
        thread={thread}
        projectId={projectId}
        targetEntryId={target}
        scrollRef={keptScroll}
        onRetry={() => {
          void messages.refetch()
          void runs.refetch()
        }}
      />
      {runOnScreen !== null && pendingReview !== null && (
        <ChatColumn className="pt-4">
          <PendingReview interrupt={pendingReview} run={runOnScreen} projectId={projectId} />
        </ChatColumn>
      )}
      <ChatColumn className={cn('pb-2', pendingReview === null ? 'pt-4' : 'pt-2')}>
        <ActivityPrompt
          projectId={projectId}
          thread={thread}
          run={runOnScreen}
          shouldFocus={isEmpty}
          size={pendingReview === null ? 'compact' : 'slim'}
        />
      </ChatColumn>
      <TargetScroller target={target} />
    </>
  )
}

interface ChatBodyProps {
  state: ChatState
  runs: readonly Run[]
  byRun: ReadonlyMap<string | null, Message[]>
  thread: Thread | null
  projectId: string
  targetEntryId: string | null
  scrollRef: ComponentProps<typeof MessageScrollerViewport>['ref']
  onRetry: () => void
}

/** What the chat shows in the place of its messages: the empty state, the load, its failure, or the runs one after another. */
function ChatBody({
  state,
  runs,
  byRun,
  thread,
  projectId,
  targetEntryId,
  scrollRef,
  onRetry,
}: ChatBodyProps) {
  if (state === 'empty') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={ActivityIcon}
            title={activityChatMessages.emptyTitle}
            description={activityChatMessages.emptyDescription}
          />
        </div>
      </div>
    )
  }
  if (state === 'pending') return <ChatLoading />
  if (state === 'error') {
    return <ErrorState message={activityChatMessages.loadError} onRetry={onRetry} />
  }
  return (
    <MessageScrollerProvider>
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport ref={scrollRef}>
          <MessageScrollerContent className="mx-auto max-w-4xl px-6 pt-6">
            {runs.map((run) => (
              <MessageScrollerItem key={run.id} scrollAnchor={run === runs.at(-1)}>
                <RunActivity
                  run={run}
                  messages={byRun.get(run.id) ?? EMPTY_MESSAGES}
                  thread={thread}
                  projectId={projectId}
                  targetEntryId={targetEntryId}
                />
              </MessageScrollerItem>
            ))}
            {(byRun.get(null) ?? EMPTY_MESSAGES).map((message) => (
              <MessageScrollerItem key={message.id}>
                <UserMessageBubble message={message} />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

/** The lines that stand for the chat while it loads. */
function ChatLoading() {
  return (
    <LoadingState
      label={activityChatMessages.loading}
      layout="lines"
      alternate
      rows={6}
      gap={4}
      itemHeight={10}
    />
  )
}

/**
 * The bubble of a message of the user that no run has taken in yet, at the end of the chat: it is
 * always the newest message, since a run takes a message in as soon as it exists.
 */
function UserMessageBubble({ message }: { message: Message }) {
  return (
    <div id={entryAnchorId(message.id)} className="px-1 py-1.5">
      <MessageRow align="end">
        <MessageContent>
          <Bubble align="end" variant="tinted">
            <BubbleContent>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </MessageRow>
    </div>
  )
}

/** Scrolls the entry the address names into view once its run has loaded. */
function TargetScroller({ target }: { target: string | null }) {
  useScrollIntoViewById(target === null ? null : entryAnchorId(target), {
    block: 'center',
    focus: true,
  })
  return null
}
