// An event of the stream is a MessageEvent; a failure of the connection is a plain Event.
type Listener = (event: Event) => void

/**
 * The stand-in of EventSource in unit tests, since jsdom has none: it opens nothing, and a test
 * sends the events of the stream itself with `emit`.
 */
export class EventSourceStub {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  static readonly opened: EventSourceStub[] = []
  readonly url: string
  readyState: number = EventSourceStub.OPEN
  private readonly listeners = new Map<string, Set<Listener>>()

  constructor(url: string | URL) {
    this.url = String(url)
    EventSourceStub.opened.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  get closed() {
    return this.readyState === EventSourceStub.CLOSED
  }

  close() {
    this.readyState = EventSourceStub.CLOSED
  }

  /** Sends an event of the stream, as the server does, unless the stream is closed. */
  emit(type: string, payload: unknown = {}, id = '') {
    if (this.closed) return
    this.dispatch(type, new MessageEvent(type, { data: JSON.stringify(payload), lastEventId: id }))
  }

  /** Fails the connection for good, as an error status does: the stream closes and says so. */
  fail() {
    this.readyState = EventSourceStub.CLOSED
    this.dispatch('error', new Event('error'))
  }

  private dispatch(type: string, event: Event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

/** The event streams that the code under test opened, the first first. */
export function openedEventSources(): readonly EventSourceStub[] {
  return EventSourceStub.opened
}

/** Forgets the streams opened, between two tests. */
export function resetEventSources() {
  EventSourceStub.opened.length = 0
}
