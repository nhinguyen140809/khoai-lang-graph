import { afterEach, describe, expect, it, vi } from 'vitest'

import { scrollToStartIfTall } from '../scroll.utils'

/** An area that scrolls, of the given height, that holds an element of another height; jsdom has no layout, so the heights are given. */
function pageWith(scrollerHeight: number, elementHeight: number) {
  const scrollIntoView = vi.fn()
  document.body.innerHTML =
    '<div id="scroller" style="overflow-y: auto"><div id="entry"></div></div>'
  const scroller = document.getElementById('scroller')
  const element = document.getElementById('entry')
  if (scroller === null || element === null) throw new Error('The page is not built')
  Object.defineProperty(scroller, 'clientHeight', { value: scrollerHeight })
  Object.defineProperty(element, 'offsetHeight', { value: elementHeight })
  element.scrollIntoView = scrollIntoView
  return scrollIntoView
}

describe('scrollToStartIfTall', () => {
  it('does nothing for an element that no area scrolls', () => {
    const scrollIntoView = pageWith(400, 900)
    const scroller = document.getElementById('scroller')
    if (scroller !== null) scroller.style.overflowY = 'visible'

    scrollToStartIfTall('entry')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('moves the start of an element taller than its scroller into view', () => {
    const scrollIntoView = pageWith(400, 900)

    scrollToStartIfTall('entry')

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
  })

  it('leaves an element that fits in its scroller', () => {
    const scrollIntoView = pageWith(400, 400)

    scrollToStartIfTall('entry')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing for an element that is not in the page', () => {
    const scrollIntoView = pageWith(400, 900)

    scrollToStartIfTall('missing')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
