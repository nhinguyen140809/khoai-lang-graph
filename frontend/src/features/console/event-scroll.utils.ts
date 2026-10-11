import { eventDomId } from './event-log.utils'

// How long the event that was navigated to stays highlighted.
const FLASH_MS = 1500

let following = true

/** Whether the event log scrolls to its newest row when it grows. */
export function isFollowingLog(): boolean {
  return following
}

export function followLog(follow: boolean) {
  following = follow
}

/**
 * Scrolls the event log to an event and highlights it for a moment. The log stops following its
 * newest row, so that what arrives next does not take the reader away from the event.
 */
export function scrollToEvent(eventId: string) {
  const element = document.getElementById(eventDomId(eventId))
  if (element === null) return
  following = false
  element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  element.dataset.flash = 'true'
  setTimeout(() => {
    delete element.dataset.flash
  }, FLASH_MS)
}
