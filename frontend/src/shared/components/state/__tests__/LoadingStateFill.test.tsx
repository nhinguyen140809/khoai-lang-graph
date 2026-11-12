import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LoadingState } from '../LoadingState'
import type { LoadingLayout } from '../state.types'

type Callback = (entries: { borderBoxSize: { inlineSize: number; blockSize: number }[] }[]) => void

function stubResizeObserver() {
  let callback: Callback | undefined
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(next: Callback) {
        callback = next
      }
      observe() {
        // The test decides when a size arrives.
      }
      disconnect() {
        // Nothing is observed.
      }
    },
  )
  return (height: number) => {
    act(() => {
      callback?.([{ borderBoxSize: [{ inlineSize: 800, blockSize: height }] }])
    })
  }
}

const skeletonsOf = (container: HTMLElement) =>
  container.querySelectorAll('[data-slot="skeleton"]').length

/** A container 600 pixels high, and the skeletons of a layout that adds rows to fill it. */
const addingRows: { layout: LoadingLayout; skeletons: number; unit: string }[] = [
  { layout: 'lines', skeletons: 17, unit: 'rows of 20px with a gap of 12px' },
  { layout: 'list', skeletons: 30, unit: 'rows of 40px with a gap of 16px' },
  { layout: 'cards', skeletons: 12, unit: 'boxes of 112px with a gap of 16px' },
  { layout: 'feed', skeletons: 24, unit: 'entries of 68px with a gap of 24px' },
  { layout: 'table', skeletons: 54, unit: 'rows of 33px' },
  { layout: 'document', skeletons: 16, unit: 'paragraphs of 64px with a gap of 24px' },
]

describe('LoadingState filling its container', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(addingRows)('adds rows to $layout: $unit', ({ layout, skeletons }) => {
    const resizeTo = stubResizeObserver()
    const { container } = render(<LoadingState label="Loading" layout={layout} rows={2} />)
    expect(skeletonsOf(container)).toBeLessThan(skeletons)

    resizeTo(600)

    expect(skeletonsOf(container)).toBe(skeletons)
  })

  it('makes the blocks of a grid taller and keeps their rows', () => {
    const resizeTo = stubResizeObserver()
    const { container } = render(<LoadingState label="Loading" layout="grid" rows={2} />)
    const before = skeletonsOf(container)

    resizeTo(600)

    expect(skeletonsOf(container)).toBe(before)
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveStyle({
      height: 'calc(var(--spacing) * 67)',
    })
  })

  it('makes the blocks of a detail taller and keeps its sections', () => {
    const resizeTo = stubResizeObserver()
    const { container } = render(<LoadingState label="Loading" layout="detail" rows={2} />)
    const before = skeletonsOf(container)

    resizeTo(600)

    expect(skeletonsOf(container)).toBe(before)
    expect(container.querySelectorAll('[data-slot="skeleton"]')[5]).toHaveStyle({
      height: 'calc(var(--spacing) * 47)',
    })
  })

  it('keeps the rows it was asked for when it is told not to fill', () => {
    const resizeTo = stubResizeObserver()
    const { container } = render(
      <LoadingState label="Loading" layout="list" rows={2} fill={false} />,
    )

    resizeTo(600)

    expect(skeletonsOf(container)).toBe(6)
  })

  it('takes turns at the start and at the end of the width when it alternates', () => {
    render(<LoadingState label="Loading" layout="lines" rows={3} alternate fill={false} />)

    const rows = screen.getByRole('status').querySelectorAll('[data-slot="skeleton"]')
    expect(rows[0]).toHaveClass('self-start')
    expect(rows[1]).toHaveClass('self-end')
    expect(rows[2]).toHaveClass('self-start')
  })
})
