import { describe, expect, it, vi } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useScrollIntoView } from '../useScrollIntoView'

// jsdom does not scroll; the calls are what the test reads.
const scrollIntoView = vi.fn()
HTMLDivElement.prototype.scrollIntoView = scrollIntoView

function mount(
  elementOf: () => HTMLElement | null,
  key: string | null,
  options?: Parameters<typeof useScrollIntoView>[2],
) {
  const view = renderHookWithProviders(
    (next: { elementOf: typeof elementOf; key: string | null }) => {
      useScrollIntoView(next.elementOf, next.key, options)
    },
    { initialProps: { elementOf, key } },
  )
  return view
}

describe('useScrollIntoView', () => {
  it('scrolls the element with nearest by default once ready', () => {
    const element = document.createElement('div')
    mount(() => element, 'item-1')

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('scrolls with center and gives the element the focus when asked', () => {
    const element = document.createElement('div')
    const focus = vi.fn()
    element.focus = focus
    mount(() => element, 'item-1', { block: 'center', focus: true })

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
    expect(focus).toHaveBeenCalled()
  })

  it('scrolls nothing before ready, for a null key, or without an element', () => {
    const element = document.createElement('div')
    mount(() => element, 'item-1', { isReady: false })
    mount(() => null, 'item-1')
    mount(() => element, null)

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls again when the key changes, not when only the element changes', () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    const view = mount(() => first, 'item-1')

    view.rerender({ elementOf: () => second, key: 'item-1' })
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    view.rerender({ elementOf: () => second, key: 'item-2' })
    expect(scrollIntoView).toHaveBeenCalledTimes(2)
  })
})
