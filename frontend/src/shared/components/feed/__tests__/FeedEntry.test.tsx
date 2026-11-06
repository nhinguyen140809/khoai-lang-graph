import { render, screen } from '@testing-library/react'
import { ChevronRightIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/shared/components/ui/button'
import { expectNoAccessibilityViolations, expectText } from '@/test/steps'

import { FeedEntry } from '../FeedEntry'

describe('FeedEntry', () => {
  it('shows its content with its mark hidden from assistive technology and its label read', async () => {
    render(
      <FeedEntry anchorId="entry-1" mark={<ChevronRightIcon />} label="You">
        Try a design that suits both.
      </FeedEntry>,
    )

    await expectText('Try a design that suits both.')
    expect(screen.getByText('You:')).toHaveClass('sr-only')
    await expectNoAccessibilityViolations()
  })

  it('hides its mark from assistive technology, whatever it is', () => {
    render(
      <FeedEntry anchorId="entry-2" mark={<ChevronRightIcon />} label="Agents">
        Grouping the raw requirements by topic.
      </FeedEntry>,
    )

    expect(screen.getAllByRole('generic', { hidden: true }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('fills the entries of the user and marks the one the address names', () => {
    const { rerender } = render(
      <FeedEntry anchorId="entry-3" mark={<ChevronRightIcon />} label="You">
        Also ask about group sessions.
      </FeedEntry>,
    )

    const entry = document.getElementById('entry-3')
    expect(entry).not.toHaveAttribute('data-filled')
    expect(entry).not.toHaveAttribute('data-target')

    rerender(
      <FeedEntry anchorId="entry-3" mark={<ChevronRightIcon />} label="You" isFilled isTarget>
        Also ask about group sessions.
      </FeedEntry>,
    )

    expect(entry).toHaveAttribute('data-filled', 'true')
    expect(entry).toHaveAttribute('data-target', 'true')
    expect(entry).toHaveAttribute('tabindex', '-1')
  })

  it('takes the focus as the target', () => {
    render(
      <FeedEntry anchorId="entry-4" mark={<ChevronRightIcon />} label="You" isTarget>
        A target entry.
      </FeedEntry>,
    )

    document.getElementById('entry-4')?.focus()
    expect(document.activeElement?.id).toBe('entry-4')
  })

  it('shows its actions on focus within', () => {
    render(
      <FeedEntry
        anchorId="entry-5"
        mark={<ChevronRightIcon />}
        label="You"
        actions={<Button>Copy</Button>}
      >
        An entry with an action.
      </FeedEntry>,
    )

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })
})
