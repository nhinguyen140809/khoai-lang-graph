'use client'

import {
  CircleCheckIcon,
  FileTextIcon,
  type LucideIcon,
  NotebookPenIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import type { Tone } from '@/lib/tone.constants'

/**
 * An entry of the thread. A message without an author is the user's, at the end of the row; a
 * marker notes an event, a separator opens a part of the thread, and `running` is the step that
 * is in progress.
 */
type ThreadEntry =
  | {
      kind: 'message'
      initials: string
      author?: string
      text: string
      attachment?: { name: string; description: string }
      time?: string
    }
  | { kind: 'marker'; Icon: LucideIcon; color?: Tone; text: string }
  | { kind: 'separator'; text: string }
  | { kind: 'running'; text: string }

const thread: ThreadEntry[] = [
  {
    kind: 'message',
    initials: 'YN',
    text: 'I want an online platform where university students find mentors.',
    attachment: { name: 'project-brief.pdf', description: 'PDF, 240 KB' },
  },
  { kind: 'marker', Icon: NotebookPenIcon, text: 'planner wrote the elicitation plan v1' },
  {
    kind: 'marker',
    Icon: CircleCheckIcon,
    color: 'success',
    text: 'Personas approved at checkpoint_personas',
  },
  {
    kind: 'marker',
    Icon: TriangleAlertIcon,
    color: 'warning',
    text: 'PER-002 ran out of turns before the last topic',
  },
  { kind: 'separator', text: 'Interviews with 3 personas' },
  {
    kind: 'message',
    initials: 'AN',
    author: 'analyst',
    text: 'PER-001 and PER-003 disagree on who approves a booking, see CONF-001.',
    time: '0:52',
  },
  { kind: 'running', text: 'requirement_engineer is writing the specification' },
]

function ThreadRow({ entry }: { entry: ThreadEntry }) {
  switch (entry.kind) {
    case 'message':
      return (
        <Message align={entry.author ? 'start' : 'end'}>
          <MessageAvatar>
            <Avatar>
              <AvatarFallback>{entry.initials}</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            {entry.author && <MessageHeader>{entry.author}</MessageHeader>}
            <Bubble variant={entry.author ? 'muted' : 'default'}>
              <BubbleContent>{entry.text}</BubbleContent>
            </Bubble>
            {entry.attachment && (
              <Attachment className="w-full">
                <AttachmentMedia>
                  <FileTextIcon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{entry.attachment.name}</AttachmentTitle>
                  <AttachmentDescription>{entry.attachment.description}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction aria-label={`Remove ${entry.attachment.name}`}>
                    <XIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            )}
            {entry.time && <MessageFooter>{entry.time}</MessageFooter>}
          </MessageContent>
        </Message>
      )
    case 'marker':
      return (
        <Marker color={entry.color}>
          <MarkerIcon>
            <entry.Icon />
          </MarkerIcon>
          <MarkerContent>{entry.text}</MarkerContent>
        </Marker>
      )
    case 'separator':
      return (
        <Marker variant="separator">
          <MarkerContent>{entry.text}</MarkerContent>
        </Marker>
      )
    case 'running':
      return (
        <Marker role="status" color="primary">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent className="shimmer">{entry.text}</MarkerContent>
        </Marker>
      )
  }
}

export function ChatCard() {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-3">
        <CardTitle>Mentor platform</CardTitle>
        <CardDescription>Message, bubble, marker, attachment, message scroller.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <MessageScrollerProvider>
          <MessageScroller className="h-80">
            <MessageScrollerViewport>
              <MessageScrollerContent className="flex flex-col gap-4 p-4">
                {thread.map((entry) => (
                  <ThreadRow key={entry.text} entry={entry} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </CardContent>
    </Card>
  )
}
