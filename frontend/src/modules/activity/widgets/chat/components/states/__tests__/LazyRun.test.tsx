import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { expectNoText, expectText } from '@/test/steps'

import { LazyRun } from '../LazyRun'

type Report = (entries: Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>[]) => void

const reports = new Map<string, Report>()

class FakeObserver {
  constructor(callback: Report, { rootMargin = '' }: IntersectionObserverInit = {}) {
    reports.set(rootMargin, callback)
  }
  observe() {
    // Nothing to watch: the test says when the place is near.
  }
  unobserve() {
    // Nothing to stop.
  }
}

function tell(place: Element | null, isIntersecting: boolean) {
  const report = [...reports.values()][0]
  if (report === undefined || place === null) throw new Error('Nothing watches the place')
  act(() => {
    report([{ target: place, isIntersecting }])
  })
}

describe('LazyRun', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    reports.clear()
  })

  it('draws the run once the reader is near it, and keeps it drawn when they go away', async () => {
    const { container } = render(
      <LazyRun isEager={false}>
        <p>The run</p>
      </LazyRun>,
    )
    const place = container.querySelector('[data-slot=lazy-run]')

    expectNoText('The run')

    tell(place, true)
    await expectText('The run')

    tell(place, false)
    await expectText('The run')
  })

  it('draws an eager run at once', async () => {
    render(
      <LazyRun isEager>
        <p>The run</p>
      </LazyRun>,
    )

    await expectText('The run')
  })
})
