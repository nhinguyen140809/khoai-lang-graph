'use client'

import { cn } from 'cn'
import { ActivityIcon } from 'lucide-react'
import { type ComponentProps, type ComponentType, Suspense } from 'react'

import { entryAnchorId, useActivityThread } from '@/modules/activity/entities'
import type { Run } from '@/modules/run/entities'
import { type Message, type MessageAuthor, type Thread } from '@/modules/thread/entities'
import { AgentFace, FaceName } from '@/shared/components/face'
import { PageColumn } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Bubble, BubbleContent } from '@/shared/components/ui/bubble'
import { Markdown } from '@/shared/components/ui/markdown'
import { Message as MessageRow, MessageContent, MessageHeader } from '@/shared/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/shared/components/ui/message-scroller'
import { useKeptScroll } from '@/shared/lib/memory'
import { toneClasses } from '@/shared/lib/tone'
import { useScrollIntoViewById } from '@/shared/lib/viewport'
import { RouteParam, useRouteParam } from '@/shared/routes'

import { activityChatMessages, emptyMessages } from '../activity-chat.constants'
import { chatBlocksOf } from '../chat-blocks.utils'
import type { ChatState, OlderRuns as OlderRunsLoad } from '../chat-state.types'
import { useRegisterUiCommands } from '../hooks/useRegisterUiCommands'
import { useReviewFocus } from '../hooks/useReviewFocus'
import { useThreadChat } from '../hooks/useThreadChat'
import { RunActivity } from './entries/RunActivity'
import { ActivityPrompt } from './prompt/ActivityPrompt'
import { LazyRun } from './states/LazyRun'
import { OlderRuns } from './states/OlderRuns'
import { PendingReview } from './states/PendingReview'

/** The column of the chat: wide enough to read in comfort, with room at its sides. */
function ChatColumn({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-4xl px-6', className)} {...props} />
}

interface ActivityChatProps {
  projectId: string
}

/**
 * The chat of the activity of a project: its runs one after another, and the prompt under them.
 * It knows no frame: the page that places it says what opening a document or an item does.
 */
export function ActivityChat({ projectId }: ActivityChatProps) {
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
          <ThreadChat projectId={projectId} thread={thread.thread} threadId={threadId ?? null} />
        </Suspense>
      )}
    </div>
  )
}

/** The chat of a thread: its runs with their entries, and the prompt that sends to it. */
function ThreadChat({
  projectId,
  thread,
  threadId,
}: {
  projectId: string
  thread: Thread | null
  threadId: string | null
}) {
  const { runs, byRun, runOnScreen, pendingReview, state, retry, olderRuns } = useThreadChat(
    threadId,
    thread !== null,
  )
  const keptScroll = useKeptScroll('chat', { from: 'end' })
  const { attach: attachReview, show: showReview, hasCard: hasReview } = useReviewFocus()
  useRegisterUiCommands({ thread, showReview, hasReview })
  const target = useRouteParam(RouteParam.Entry)
  const isEmpty = state === 'empty'

  return (
    <>
      <ChatBody
        state={state}
        runs={runs}
        byRun={byRun}
        olderRuns={olderRuns}
        thread={thread}
        projectId={projectId}
        targetEntryId={target}
        scrollRef={keptScroll}
        onRetry={retry}
      />
      {runOnScreen !== null && pendingReview !== null && (
        <ChatColumn className="pt-4">
          {/* Each review has its own form: the answers of the question before it are not its own. */}
          <PendingReview
            key={pendingReview.id}
            ref={attachReview}
            interrupt={pendingReview}
            run={runOnScreen}
          />
        </ChatColumn>
      )}
      <ChatColumn className={cn('pb-1', pendingReview === null ? 'pt-4' : 'pt-2')}>
        <ActivityPrompt
          projectId={projectId}
          thread={thread}
          run={runOnScreen}
          shouldFocus={isEmpty}
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
  olderRuns: OlderRunsLoad
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
  olderRuns,
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
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport ref={scrollRef}>
          <MessageScrollerContent className="mx-auto max-w-4xl px-6 pt-6">
            <OlderRuns olderRuns={olderRuns} firstRunId={runs[0]?.id ?? null} />
            {chatBlocksOf(runs, byRun).map((block) =>
              block.type === 'run' ? (
                <MessageScrollerItem
                  key={block.run.id}
                  scrollAnchor={block.run === runs.at(-1)}
                  isLive={block.run === runs.at(-1)}
                >
                  {/* A run far from the screen is drawn when the reader nears it, unless an entry of the chat is named by the address, which could be in any of them. */}
                  <LazyRun isEager={block.run === runs.at(-1) || targetEntryId !== null}>
                    <RunActivity
                      run={block.run}
                      messages={byRun.get(block.run.id) ?? emptyMessages}
                      thread={thread}
                      projectId={projectId}
                      targetEntryId={targetEntryId}
                    />
                  </LazyRun>
                </MessageScrollerItem>
              ) : (
                <MessageScrollerItem key={block.message.id}>
                  <LooseMessage message={block.message} />
                </MessageScrollerItem>
              ),
            )}
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
    <PageColumn width="chat" isFlush>
      <LoadingState
        label={activityChatMessages.loading}
        layout="lines"
        alternate
        rows={6}
        gap={4}
        itemHeight={10}
      />
    </PageColumn>
  )
}

/**
 * A message that no run took in, in the look of who wrote it: the word of the user on their side,
 * and the answer of the assistant on the side of the agents, under its name, so that a question and
 * its answer do not both read as the words of the user.
 */
function LooseMessage({ message }: { message: Message }) {
  const Look = looseMessageLooks[message.author]
  return (
    <div id={entryAnchorId(message.id)} className="px-1 py-1.5">
      <Look message={message} />
    </div>
  )
}

/** The answer of the assistant, which no run holds, drawn as an agent of a run is drawn. */
function AssistantMessageBubble({ message }: { message: Message }) {
  const seed = message.agent_role ?? 'assistant'
  return (
    <MessageRow align="start">
      <MessageContent className="gap-2">
        <MessageHeader
          className={cn('items-center gap-1.5 px-0 text-(--tone-strong)', toneClasses.secondary)}
        >
          <AgentFace seed={seed} size="sm" />
          <FaceName seed={seed} className="text-sm font-semibold">
            {activityChatMessages.assistantName}
          </FaceName>
        </MessageHeader>
        <Markdown>{message.content}</Markdown>
      </MessageContent>
    </MessageRow>
  )
}

/** The words of the app: muted plain text on the side of the agents. */
function SystemMessageBubble({ message }: { message: Message }) {
  return (
    <MessageRow align="start">
      <MessageContent>
        <p className="text-sm text-muted-foreground">{message.content}</p>
      </MessageContent>
    </MessageRow>
  )
}

// How a message that no run holds shows, looked up by who wrote it instead of branched on, so a new
// kind of author fails to compile until it has a look of its own.
const looseMessageLooks = {
  user: UserMessageBubble,
  agent: AssistantMessageBubble,
  system: SystemMessageBubble,
} as const satisfies Record<MessageAuthor, ComponentType<{ message: Message }>>

/**
 * The bubble of a message of the user that no run has taken in yet, at the end of the chat: it is
 * always the newest message, since a run takes a message in as soon as it exists.
 */
function UserMessageBubble({ message }: { message: Message }) {
  return (
    <MessageRow align="end">
        <MessageContent>
          <Bubble align="end" variant="tinted">
            <BubbleContent>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </BubbleContent>
          </Bubble>
      </MessageContent>
    </MessageRow>
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
