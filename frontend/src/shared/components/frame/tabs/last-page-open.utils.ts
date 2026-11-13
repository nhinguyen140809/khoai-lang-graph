/** A page that a click has just opened, and where the pointer was. */
interface PageOpen {
  href: string
  at: number
  x: number
  y: number
}

/** How long after the click a double click still belongs to it, in milliseconds. */
export const doubleClickMs = 700

/** How far, in pixels, the second click may be from the first. */
export const doubleClickReach = 12

let lastClick: { at: number; x: number; y: number } | null = null
let lastOpen: PageOpen | null = null

/** Notes the place and the time of a click, before anything handles it. */
export function noteClick(event: Pick<MouseEvent, 'clientX' | 'clientY'>, now = Date.now()) {
  lastClick = { at: now, x: event.clientX, y: event.clientY }
}

/**
 * Notes that a page was opened. A page opened by the click that was just noted keeps the place of
 * that click; a page opened by anything else, such as a key, has no place and is never kept by a
 * double click.
 */
export function notePageOpen(href: string, now = Date.now()) {
  const click = lastClick !== null && now - lastClick.at < 100 ? lastClick : null
  lastOpen = click === null ? null : { href, at: now, x: click.x, y: click.y }
}

/**
 * The page that a double click at this place and time belongs to: the one that the click before it
 * opened, when this one is near it in time and in place. The page that the first click opened may
 * have taken the place of the one under the pointer, so the second click is not on the element of
 * the first.
 */
export function pageOpenedByDoubleClick(
  event: Pick<MouseEvent, 'clientX' | 'clientY'>,
  now = Date.now(),
): string | null {
  if (lastOpen === null || now - lastOpen.at > doubleClickMs) return null
  const isNear =
    Math.abs(event.clientX - lastOpen.x) <= doubleClickReach &&
    Math.abs(event.clientY - lastOpen.y) <= doubleClickReach
  return isNear ? lastOpen.href : null
}
