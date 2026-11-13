import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Reveal } from '../Reveal'
import { revealMaxSteps, revealStepMs } from '../reveal.constants'

describe('Reveal', () => {
  it('starts later for a later place', () => {
    render(<Reveal index={2}>item</Reveal>)

    expect(screen.getByText('item')).toHaveStyle({
      animationDelay: `${String(2 * revealStepMs)}ms`,
    })
  })

  it('stops delaying after the last step', () => {
    render(<Reveal index={100}>item</Reveal>)

    expect(screen.getByText('item')).toHaveStyle({
      animationDelay: `${String(revealMaxSteps * revealStepMs)}ms`,
    })
  })

  it('puts the motion on the child it wraps', () => {
    render(
      <ul>
        <Reveal asChild>
          <li>item</li>
        </Reveal>
      </ul>,
    )

    expect(screen.getByRole('listitem')).toHaveAttribute('data-slot', 'reveal')
  })

  it('takes the time of each item, the time before the first, and the time between items', () => {
    render(
      <Reveal index={2} duration={600} delay={100} step={50}>
        item
      </Reveal>,
    )

    expect(screen.getByText('item')).toHaveStyle({
      animationDuration: '600ms',
      animationDelay: '200ms',
    })
  })

  it('stops the time between items at the place it is given', () => {
    render(
      <Reveal index={9} step={50} maxSteps={3}>
        item
      </Reveal>,
    )

    expect(screen.getByText('item')).toHaveStyle({ animationDelay: '150ms' })
  })
})
