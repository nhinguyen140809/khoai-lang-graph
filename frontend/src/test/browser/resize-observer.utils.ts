import { act } from '@testing-library/react'
import { vi } from 'vitest'

type Callback = (entries: { borderBoxSize: { inlineSize: number; blockSize: number }[] }[]) => void

interface StubOptions {
  /**
   * A size that every element reports as soon as it is observed, once, as a browser does after the
   * first layout. Without it nothing is reported until the test calls `resizeTo`.
   */
  initialSize?: { width: number; height: number }
}

const entryOf = (width: number, height: number) => ({
  borderBoxSize: [{ inlineSize: width, blockSize: height }],
})

/**
 * Stands in for ResizeObserver, which jsdom has no layout for: the test decides what size arrives
 * and when. `resizeTo` calls the callback of the latest observer, the way the browser calls it on a
 * resize; `disconnect` is a spy on the call that ends the observing.
 */
export function stubResizeObserver({ initialSize }: StubOptions = {}) {
  const callbacks: Callback[] = []
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly callback: Callback
      constructor(callback: Callback) {
        this.callback = callback
        callbacks.push(callback)
      }
      observe() {
        if (initialSize === undefined) return
        // The first size comes after the render, as a browser gives it.
        void Promise.resolve().then(() => {
          act(() => {
            this.callback([entryOf(initialSize.width, initialSize.height)])
          })
        })
      }
      unobserve() {
        // Nothing is kept per element.
      }
      disconnect = disconnect
    },
  )
  const resizeTo = (width: number, height: number) => {
    act(() => {
      callbacks.at(-1)?.([entryOf(width, height)])
    })
  }
  return { resizeTo, disconnect }
}
