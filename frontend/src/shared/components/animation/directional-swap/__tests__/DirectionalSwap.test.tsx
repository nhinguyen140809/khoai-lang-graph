import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { swapMs } from '../directional-swap.constants'
import { DirectionalSwap } from '../DirectionalSwap'

describe('DirectionalSwap', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('brings the content in from below by default, over half its height', () => {
    render(<DirectionalSwap swapKey="a">one</DirectionalSwap>)

    expect(screen.getByText('one')).toHaveStyle({ '--tw-enter-translate-y': '50%' })
  })

  it.each([
    ['down', '--tw-enter-translate-y', '-50%'],
    ['left', '--tw-enter-translate-x', '50%'],
    ['right', '--tw-enter-translate-x', '-50%'],
  ] as const)('starts the new content on the side %s comes from', (direction, property, value) => {
    render(
      <DirectionalSwap swapKey="a" direction={direction}>
        one
      </DirectionalSwap>,
    )

    expect(screen.getByText('one').style.getPropertyValue(property)).toBe(value)
  })

  it('takes the distance as a share of the size of the content', () => {
    render(
      <DirectionalSwap swapKey="a" direction="left" distance={1}>
        one
      </DirectionalSwap>,
    )

    expect(screen.getByText('one').style.getPropertyValue('--tw-enter-translate-x')).toBe('100%')
  })

  it('keeps the old content out of the way while it leaves, then removes it', () => {
    const { rerender } = render(<DirectionalSwap swapKey="a">one</DirectionalSwap>)

    rerender(<DirectionalSwap swapKey="b">two</DirectionalSwap>)

    const old = screen.getByText('one')
    expect(old).toHaveAttribute('aria-hidden', 'true')
    expect(old.style.getPropertyValue('--tw-exit-translate-y')).toBe('-50%')
    expect(screen.getByText('two')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(swapMs)
    })

    expect(screen.queryByText('one')).not.toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  it('sends the old content the way of the move', () => {
    const { rerender } = render(
      <DirectionalSwap swapKey="a" direction="left">
        one
      </DirectionalSwap>,
    )

    rerender(
      <DirectionalSwap swapKey="b" direction="left">
        two
      </DirectionalSwap>,
    )

    expect(screen.getByText('one').style.getPropertyValue('--tw-exit-translate-x')).toBe('-50%')
  })

  it('fades the old content out in place when the exit is a fade', () => {
    const { rerender } = render(
      <DirectionalSwap swapKey="a" exit="fade">
        one
      </DirectionalSwap>,
    )

    rerender(
      <DirectionalSwap swapKey="b" exit="fade">
        two
      </DirectionalSwap>,
    )

    const old = screen.getByText('one')
    expect(old).toHaveClass('animate-out', 'fade-out-0')
    expect(old.style.getPropertyValue('--tw-exit-translate-y')).toBe('')
    expect(screen.getByText('two').style.getPropertyValue('--tw-enter-translate-y')).toBe('50%')
  })

  it('brings the new content in without a slide when the enter is a fade', () => {
    render(
      <DirectionalSwap swapKey="a" enter="fade" direction="left">
        one
      </DirectionalSwap>,
    )

    const entering = screen.getByText('one')
    expect(entering).toHaveClass('fade-in-0')
    expect(entering.style.getPropertyValue('--tw-enter-translate-x')).toBe('')
  })

  it('runs as long as it is asked to', () => {
    render(
      <DirectionalSwap swapKey="a" duration={800}>
        one
      </DirectionalSwap>,
    )

    expect(screen.getByText('one')).toHaveStyle({ animationDuration: '800ms' })
  })

  it('waits for the old content to go out before the new content comes in', () => {
    const { rerender } = render(
      <DirectionalSwap swapKey="a" mode="wait">
        one
      </DirectionalSwap>,
    )

    rerender(
      <DirectionalSwap swapKey="b" mode="wait">
        two
      </DirectionalSwap>,
    )
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.queryByText('two')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(swapMs)
    })

    expect(screen.queryByText('one')).not.toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  it('lets the old content leave as it was last seen under its key', () => {
    const { rerender } = render(<DirectionalSwap swapKey="a">loading</DirectionalSwap>)
    rerender(<DirectionalSwap swapKey="a">loaded</DirectionalSwap>)

    rerender(<DirectionalSwap swapKey="b">next</DirectionalSwap>)

    expect(screen.getByText('loaded')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('lets the old content leave over the new one without taking room when they cross', () => {
    const { rerender } = render(<DirectionalSwap swapKey="a">one</DirectionalSwap>)

    rerender(<DirectionalSwap swapKey="b">two</DirectionalSwap>)

    expect(screen.getByText('one')).toHaveClass('absolute')
  })

  it('keeps the old content in the room it takes while the new content waits', () => {
    const { rerender } = render(
      <DirectionalSwap swapKey="a" mode="wait">
        one
      </DirectionalSwap>,
    )

    rerender(
      <DirectionalSwap swapKey="b" mode="wait">
        two
      </DirectionalSwap>,
    )

    expect(screen.getByText('one')).not.toHaveClass('absolute')
  })
})
