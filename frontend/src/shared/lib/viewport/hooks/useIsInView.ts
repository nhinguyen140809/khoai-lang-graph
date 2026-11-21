import { type RefObject, useEffect, useState } from 'react'

/** How far past the edge of the screen an element counts as in view, unless it says: what is about to scroll in has started by the time it does. */
const defaultMargin = '200px'

interface Watch {
  observer: IntersectionObserver
  listeners: WeakMap<Element, (isInView: boolean) => void>
}

const watches = new Map<string, Watch>()

/** One observer for every element that asks with the same margin, as a page of many of them would otherwise have many. */
function watchFor(margin: string): Watch {
  const known = watches.get(margin)
  if (known !== undefined) return known
  const listeners = new WeakMap<Element, (isInView: boolean) => void>()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) listeners.get(entry.target)?.(entry.isIntersecting)
    },
    { rootMargin: margin },
  )
  const made = { observer, listeners }
  watches.set(margin, made)
  return made
}

interface IsInViewOptions {
  margin?: string
  /** What it is until the browser says: true by default, so that the page renders the same on the server and on the client, and for a browser that cannot say; false for what should not start before it is near. */
  initial?: boolean
}

/** Whether an element is on the screen, or near it by `margin`; always true where the browser cannot say. */
export function useIsInView(
  ref: RefObject<Element | null>,
  { margin = defaultMargin, initial = true }: IsInViewOptions = {},
): boolean {
  const [isInView, setIsInView] = useState(initial)

  useEffect(() => {
    const element = ref.current
    if (element === null || typeof IntersectionObserver === 'undefined') return
    const { observer, listeners } = watchFor(margin)
    listeners.set(element, setIsInView)
    observer.observe(element)
    return () => {
      observer.unobserve(element)
      listeners.delete(element)
    }
  }, [ref, margin])

  // A browser that cannot say, and a page that renders on the server, take every element as in view.
  return typeof IntersectionObserver === 'undefined' || isInView
}
