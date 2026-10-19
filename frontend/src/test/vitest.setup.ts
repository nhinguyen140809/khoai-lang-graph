import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { resetMockData } from '@/mocks/shared/mock-db.utils'
import { EventSourceStub, resetEventSources } from '@/test/event-source.utils'

// Unit tests run without the Next.js router, so every test gets the stand-in of next/navigation
// (src/test/next-mocks.utils.ts). The mock handlers loaded here import modules that read the
// router; mocked in a test file instead, the real router would already be bound to them.
vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

// Browser APIs that jsdom lacks: resizable panels observe their size, the command palette
// scrolls the selected command into view, and the theme provider asks for the system theme.
class ResizeObserverStub {
  observe() {
    // jsdom has no layout, so sizes never change.
  }
  unobserve() {
    // Nothing is observed.
  }
  disconnect() {
    // Nothing is observed.
  }
}
if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', { value: ResizeObserverStub, writable: true })
}
// jsdom declares matchMedia without implementing it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList,
})

// jsdom has no EventSource: a test sends the events of a stream through the stand-in.
if (!('EventSource' in globalThis)) {
  Object.defineProperty(globalThis, 'EventSource', { value: EventSourceStub, writable: true })
}

if (!('scrollIntoView' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => undefined,
    writable: true,
  })
}

// jsdom has no pointer capture, which the select of Radix UI asks for when it opens.
for (const method of ['hasPointerCapture', 'setPointerCapture', 'releasePointerCapture'] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, {
      value: () => false,
      writable: true,
    })
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetMockData()
  resetEventSources()
  cleanup()
})

afterAll(() => {
  server.close()
})
