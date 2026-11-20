/* eslint-disable local/expect-steps -- under fake timers a step never finishes waiting, so these tests read with getBy* (CONTRIBUTING: Fake timers) */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { motionMs } from '@/shared/lib/animation'
import { advanceTimers, expectNoText, withFakeTimers } from '@/test/steps'

import { Presence } from '../Presence'

describe('Presence', () => {
  withFakeTimers()

  it('shows the content while it is present', () => {
    render(<Presence present>note</Presence>)

    expect(screen.getByText('note')).toHaveAttribute('data-state', 'open')
  })

  it('renders nothing while it has not been present', () => {
    render(<Presence present={false}>note</Presence>)

    expectNoText('note')
  })

  it('plays the exit before it removes the content', () => {
    const { rerender } = render(<Presence present>note</Presence>)

    rerender(<Presence present={false}>note</Presence>)
    expect(screen.getByText('note')).toHaveAttribute('data-state', 'closed')

    advanceTimers(motionMs)
    expect(screen.queryByText('note')).not.toBeInTheDocument()
  })

  it('keeps the content when it comes back during the exit', () => {
    const { rerender } = render(<Presence present>note</Presence>)

    rerender(<Presence present={false}>note</Presence>)
    rerender(<Presence present>note</Presence>)
    advanceTimers(motionMs)

    expect(screen.getByText('note')).toHaveAttribute('data-state', 'open')
  })

  it('slides from the side it is given', () => {
    render(
      <Presence present variant="left">
        note
      </Presence>,
    )

    expect(screen.getByText('note')).toHaveClass('data-[state=open]:slide-in-from-left-4')
  })

  it('plays for as long as it is asked to, and leaves after that', () => {
    const { rerender } = render(
      <Presence present duration={800}>
        note
      </Presence>,
    )
    expect(screen.getByText('note')).toHaveStyle({ animationDuration: '800ms' })

    rerender(
      <Presence present={false} duration={800}>
        note
      </Presence>,
    )
    advanceTimers(motionMs)
    expect(screen.getByText('note')).toBeInTheDocument()

    advanceTimers(800 - motionMs)
    expectNoText('note')
  })
})
