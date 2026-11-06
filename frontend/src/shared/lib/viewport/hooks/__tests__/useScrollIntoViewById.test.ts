import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useScrollIntoViewById } from '../useScrollIntoViewById'

// jsdom does not scroll; the calls are what the test reads.
const scrollIntoView = vi.fn()
HTMLDivElement.prototype.scrollIntoView = scrollIntoView

function mount(id: string | null, options?: Parameters<typeof useScrollIntoViewById>[1]) {
  return renderHookWithProviders(
    (next: { id: string | null }) => {
      useScrollIntoViewById(next.id, options)
    },
    { initialProps: { id } },
  )
}

function elementWithId(id: string): HTMLDivElement {
  const element = document.createElement('div')
  element.id = id
  document.body.append(element)
  return element
}

describe('useScrollIntoViewById', () => {
  it('scrolls the element that the id names with nearest by default', () => {
    elementWithId('entry-1')
    mount('entry-1')

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('scrolls with center and gives the element the focus when asked', () => {
    const element = elementWithId('entry-1')
    const focus = vi.fn()
    element.focus = focus
    mount('entry-1', { block: 'center', focus: true })

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
    expect(focus).toHaveBeenCalled()
  })

  it('scrolls nothing before ready, for a null id, or without an element', () => {
    elementWithId('entry-1')
    mount('entry-1', { isReady: false })
    mount(null)
    mount('missing')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls the element when it appears after the mount', async () => {
    mount('entry-late')
    expect(scrollIntoView).not.toHaveBeenCalled()

    elementWithId('entry-late')

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    })
  })

  it('scrolls again when the id changes', () => {
    elementWithId('entry-1')
    elementWithId('entry-2')
    const view = mount('entry-1')

    view.rerender({ id: 'entry-2' })

    expect(scrollIntoView).toHaveBeenCalledTimes(2)
  })
})
