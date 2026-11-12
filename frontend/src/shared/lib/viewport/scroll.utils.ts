/** The closest ancestor of an element that scrolls its content: its overflow is `auto` or `scroll`. */
function scrollerOf(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent !== null; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent)
    if (overflowY === 'auto' || overflowY === 'scroll') return parent
  }
  return null
}

/**
 * Moves the start of the element that `id` names into view when it is taller than the area that
 * scrolls it, its closest ancestor that scrolls. A shorter element is left where it is, since it is
 * in view whole once the area is at its end. Does nothing when the element is not in the page or
 * has no such ancestor.
 */
export function scrollToStartIfTall(id: string): void {
  const element = document.getElementById(id)
  const scroller = element === null ? null : scrollerOf(element)
  if (element === null || scroller === null) return
  if (element.offsetHeight <= scroller.clientHeight) return
  element.scrollIntoView({ block: 'start' })
}
