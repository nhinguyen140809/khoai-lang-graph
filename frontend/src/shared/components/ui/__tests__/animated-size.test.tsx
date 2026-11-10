import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnimatedSize } from '../animated-size'

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
  return (width: number, height: number) => {
    act(() => {
      callback?.([{ borderBoxSize: [{ inlineSize: width, blockSize: height }] }])
    })
  }
}

describe('AnimatedSize', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sizes itself to its children until they are measured', () => {
    stubResizeObserver()
    render(<AnimatedSize>content</AnimatedSize>)

    const box = screen.getByText('content').parentElement
    expect(box).not.toHaveAttribute('style')
  })

  it('takes the measured size of its children as its own width and height', () => {
    const resizeTo = stubResizeObserver()
    render(<AnimatedSize>content</AnimatedSize>)

    resizeTo(320, 120)

    const box = screen.getByText('content').parentElement
    expect(box).toHaveStyle({ width: '320px', height: '120px' })
  })

  it('moves to the next size when the children change it', () => {
    const resizeTo = stubResizeObserver()
    render(<AnimatedSize>content</AnimatedSize>)

    resizeTo(320, 120)
    resizeTo(112, 36)

    const box = screen.getByText('content').parentElement
    expect(box).toHaveStyle({ width: '112px', height: '36px' })
  })

  it('gives its children the width of the classes it is given', () => {
    stubResizeObserver()
    render(<AnimatedSize contentClassName="w-80">content</AnimatedSize>)

    expect(screen.getByText('content')).toHaveClass('w-80')
    expect(screen.getByText('content')).not.toHaveClass('w-max')
  })
})
