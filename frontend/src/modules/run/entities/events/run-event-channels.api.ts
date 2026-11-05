import { hasText } from '@/shared/lib/guards'

import { runEventsUrl } from './run-events.api'
import { streamReopenMs } from './run-events.constants'
import { isTerminal, parseRunEvent } from './run-events.utils'
import { type RunChannelSignal, type RunEvent, runEventTypes } from './run-events.types'

type Listener = (signal: RunChannelSignal) => void

interface Channel {
  /** Every event read so far, in order, so that a listener that joins late still has them all. */
  events: RunEvent[]
  listeners: Set<Listener>
  source: EventSource | null
  reopenTimer: ReturnType<typeof setTimeout> | undefined
  /** Set once the run sent its last event: the stream is closed and does not open again. */
  isEnded: boolean
}

// One channel for each run that has a listener: however many parts of the app follow a run, one
// connection serves them, and it closes when the last of them leaves.
const channels = new Map<string, Channel>()

function isAfter(eventId: string, after: number | null): boolean {
  const id = Number(eventId)
  return after === null || Number.isNaN(id) || id > after
}

function openSource(runId: string, channel: Channel) {
  const lastId = channel.events.at(-1)?.id
  const source = new EventSource(runEventsUrl(runId, hasText(lastId) ? lastId : null))
  channel.source = source

  for (const type of runEventTypes) {
    source.addEventListener(type, (message) => {
      // The connection reports its own failures as `error` too, without the data of an event.
      if (!(message instanceof MessageEvent)) return
      const event = parseRunEvent(type, message.lastEventId, String(message.data))
      if (event === null) return
      channel.events.push(event)
      for (const listener of [...channel.listeners]) listener({ kind: 'event', event })
      if (isTerminal(type)) {
        channel.isEnded = true
        source.close()
      }
    })
  }
  source.addEventListener('error', () => {
    if (source.readyState !== EventSource.CLOSED || channel.isEnded) return
    for (const listener of [...channel.listeners]) listener({ kind: 'failed' })
    channel.reopenTimer = setTimeout(() => {
      if (channels.get(runId) === channel) openSource(runId, channel)
    }, streamReopenMs)
  })
}

/**
 * Listens to the events of a run. The first listener of a run opens its stream from the first
 * event, a listener that joins later first gets the events read already, and the last one to leave
 * closes the stream. With `after`, the events up to that id are left out. A stream whose
 * connection failed for good opens again a moment later, after the last event read.
 * Gives the function that stops listening.
 */
export function listenToRun(
  runId: string,
  listener: Listener,
  { after = null }: { after?: number | null } = {},
): () => void {
  let channel = channels.get(runId)
  if (channel === undefined) {
    channel = {
      events: [],
      listeners: new Set(),
      source: null,
      reopenTimer: undefined,
      isEnded: false,
    }
    channels.set(runId, channel)
    openSource(runId, channel)
  }
  const joined = channel
  joined.listeners.add(listener)
  for (const event of joined.events) {
    if (isAfter(event.id, after)) listener({ kind: 'event', event })
  }

  return () => {
    joined.listeners.delete(listener)
    if (joined.listeners.size > 0) return
    clearTimeout(joined.reopenTimer)
    joined.source?.close()
    if (channels.get(runId) === joined) channels.delete(runId)
  }
}
