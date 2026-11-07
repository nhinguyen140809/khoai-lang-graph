'use client'

import type { ReactNode } from 'react'

import {
  FieldSeparator,
  InitialsAvatar,
  type ValueDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { Bubble, BubbleContent } from '@/shared/components/ui/bubble'
import { Highlight, type HighlightRange } from '@/shared/components/ui/highlight'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '@/shared/components/ui/message'

import type { OutlineItem } from '../items/items.types'
import type { KindView, Participant } from '../outline/outline.types'
import { itemAnchorProps } from '../outline/outline.utils'
import { transcriptParts } from '../outline/transcript.utils'

// The bubble of each side of the conversation: the leader at the right in a tinted one, the
// others at the left in a muted one.
const bubbleVariants = {
  start: 'muted',
  end: 'tinted',
} as const satisfies Record<Participant['side'], 'muted' | 'tinted'>

interface ItemTranscriptProps<Range extends HighlightRange = HighlightRange> {
  items: readonly OutlineItem[]
  view: KindView
  /** The people of the conversation, from the artifact that holds the transcript. */
  participants: readonly Participant[]
  definition: ValueDefinition
  targetItemId: string | null
  messageMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  renderMessageMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

/**
 * The messages of a transcript as a conversation: the participants who lead at the right in a
 * tinted bubble, the others at the left in a muted one, each row of messages beside the avatar and
 * under the name of its participant, a separator where a value such as the turn changes, the quoted
 * words marked.
 */
export function ItemTranscript<Range extends HighlightRange = HighlightRange>({
  items,
  view,
  participants,
  definition,
  targetItemId,
  messageMarks,
  renderMessageMark,
}: ItemTranscriptProps<Range>) {
  const parts = transcriptParts(view.schema, items, participants)
  return (
    <ol className="max-w-prose space-y-4">
      {parts.map((part) =>
        part.type === 'separator' ? (
          <li key={part.key}>
            <FieldSeparator
              fields={part.fields}
              content={part.content}
              definition={definition}
              className="text-xs"
            />
          </li>
        ) : (
          <li key={part.key}>
            <Message align={part.participant.side}>
              <MessageAvatar>
                <InitialsAvatar name={part.participant.name} tone={part.participant.tone} />
              </MessageAvatar>
              <MessageContent>
                <MessageHeader>{part.participant.name}</MessageHeader>
                {part.messages.map(({ item, text }) => {
                  const marks = messageMarks?.get(item.id)
                  return (
                    <Bubble key={item.id} variant={bubbleVariants[part.participant.side]}>
                      <BubbleContent
                        {...itemAnchorProps(item.id, targetItemId)}
                        className="text-base text-pretty whitespace-pre-line data-[target]:ring-2 data-[target]:ring-ring"
                      >
                        {marks === undefined || marks.length === 0 ? (
                          text
                        ) : (
                          <Highlight
                            ranges={marks}
                            renderMark={
                              renderMessageMark === undefined
                                ? undefined
                                : (mark, range) => renderMessageMark(range, mark)
                            }
                          >
                            {text}
                          </Highlight>
                        )}
                      </BubbleContent>
                    </Bubble>
                  )
                })}
              </MessageContent>
            </Message>
          </li>
        ),
      )}
    </ol>
  )
}
