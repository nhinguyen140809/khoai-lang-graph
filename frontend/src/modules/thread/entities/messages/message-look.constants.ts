import { ChevronRightIcon, DotIcon, InfoIcon, type LucideIcon } from 'lucide-react'
import type * as React from 'react'

import type { Bubble } from '@/shared/components/ui/bubble'
import type { Tone } from '@/shared/lib/tone'

import type { MessageAuthor, MessageDelivery } from './messages.types'

/** How the mark of the author of a message shows: the tone of its color and one plain sign. */
interface MessageAuthorLook {
  tone: Tone
  icon: LucideIcon
  /** Whether the user wrote the message. */
  isUser: boolean
  /** Whether an agent wrote the message. */
  isAgent: boolean
  /** Whether the app wrote the message. */
  isSystem: boolean
}

/** How the author of each message shows: the mark of its entry in the chat. */
export const messageAuthorLooks = {
  user: { tone: 'primary', icon: ChevronRightIcon, isUser: true, isAgent: false, isSystem: false },
  agent: { tone: 'chart', icon: DotIcon, isUser: false, isAgent: true, isSystem: false },
  system: { tone: 'neutral', icon: InfoIcon, isUser: false, isAgent: false, isSystem: true },
} as const satisfies Record<MessageAuthor, MessageAuthorLook>

/** The tone of the dot of each delivery of a message of the user, as Outline reads it. */
export const messageDeliveryLooks = {
  started_run: 'primary',
  delivered: 'primary',
  pending: 'warning',
  undelivered: 'neutral',
} as const satisfies Record<MessageDelivery, Tone>

/** How the bubble of a message of the user fills, by its delivery. */
export const messageBubbleLooks = {
  started_run: 'tinted',
  delivered: 'tinted',
  pending: 'muted',
  undelivered: 'destructive',
} as const satisfies Record<MessageDelivery, React.ComponentProps<typeof Bubble>['variant']>
