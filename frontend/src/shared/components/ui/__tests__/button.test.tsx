import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Button, buttonVariants } from '../button'

describe('Button text variant', () => {
  it('is words with no fill, border or movement in any state, which only change color', () => {
    const classes = buttonVariants({ variant: 'text' })

    expect(classes).toContain('hover:text-foreground')
    expect(classes).toContain('aria-expanded:text-foreground')
    expect(classes).not.toMatch(/(^|\s)(hover:|aria-expanded:|active:)?bg-(?!clip)/)
    expect(classes).toContain('active:translate-y-0')
  })

  it('takes the strong color of a tone when it has one', () => {
    expect(buttonVariants({ variant: 'text', color: 'destructive' })).toContain(
      'hover:text-(--tone-strong)',
    )
  })

  it('is a button that can be pressed', async () => {
    let pressed = 0
    render(
      <Button
        variant="text"
        onClick={() => {
          pressed += 1
        }}
      >
        +2 items
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: '+2 items' }))

    expect(pressed).toBe(1)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'text')
  })
})
