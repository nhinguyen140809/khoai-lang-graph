'use client'

import { useEffect, useEffectEvent, useRef } from 'react'

import { entryAnchorId } from '@/modules/activity/entities'
import { useMessageScrollerScrollable } from '@/shared/components/ui/message-scroller'
import { scrollToStartIfTall } from '@/shared/lib/viewport'

import { revealDelayMs } from '../activity-chat.constants'

/**
 * Brings the start of a new message of an agent into view when it is longer than the chat. A
 * reader at the end of the chat is followed down as lines come in, which for a long message shows
 * its last lines; this moves back to its first, so it is read from the top, and the chat follows
 * again once the reader is at its end. A reader who has scrolled up is left where they are, and so
 * are the messages that are there when the chat opens. `messageIds` is null until they have loaded.
 */
export function useRevealNewMessage(messageIds: readonly string[] | null) {
  const seen = useRef<Set<string> | null>(null)
  const { end: hasContentBelow } = useMessageScrollerScrollable()

  // Read when the message arrives, before the scroller has followed it: the state of the scroller
  // changes a frame after the content does.
  const reveal = useEffectEvent((id: string) => {
    if (hasContentBelow) return undefined
    const timer = setTimeout(() => {
      scrollToStartIfTall(entryAnchorId(id))
    }, revealDelayMs)
    return () => {
      clearTimeout(timer)
    }
  })

  const key = messageIds === null ? null : messageIds.join('|')
  useEffect(() => {
    if (messageIds === null) return
    const known = seen.current
    seen.current = new Set(messageIds)
    if (known === null) return
    const arrived = messageIds.findLast((id) => !known.has(id))
    if (arrived === undefined) return
    return reveal(arrived)
    // The ids are compared by their key, so a new list of the same ids does not run it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
