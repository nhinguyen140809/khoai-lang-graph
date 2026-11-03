import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cloneElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Highlight } from '../highlight'

function marksOf(container: HTMLElement) {
  return [...container.querySelectorAll('[data-slot="highlight-mark"]')]
}

describe('Highlight', () => {
  it('marks every place of the query, in any case', () => {
    const { container } = render(<Highlight query="mentors">Mentors see mentors.</Highlight>)

    expect(marksOf(container).map((mark) => mark.textContent)).toEqual(['Mentors', 'mentors'])
    expect(container.textContent).toBe('Mentors see mentors.')
  })

  it('marks the first place only when matchAll is off', () => {
    const { container } = render(
      <Highlight query="a" matchAll={false}>
        banana
      </Highlight>,
    )

    expect(marksOf(container)).toHaveLength(1)
  })

  it('marks the ranges, each in the fill and the color it carries', () => {
    const { container } = render(
      <Highlight
        variant="soft"
        color="success"
        ranges={[
          { start: 0, end: 3 },
          { start: 4, end: 7, color: 'warning', variant: 'wavy' },
        ]}
      >
        one two three
      </Highlight>,
    )

    expect(
      marksOf(container).map((mark) => [
        mark.textContent,
        mark.getAttribute('data-variant'),
        mark.getAttribute('data-color'),
      ]),
    ).toEqual([
      ['one', 'soft', 'success'],
      ['two', 'wavy', 'warning'],
    ])
  })

  it('marks nothing without a query or ranges', () => {
    const { container } = render(<Highlight>plain</Highlight>)

    expect(marksOf(container)).toHaveLength(0)
  })

  it('leaves a mark out of the tab order unless it is interactive', () => {
    const { container } = render(<Highlight query="b">abc</Highlight>)

    expect(marksOf(container)[0]?.hasAttribute('tabindex')).toBe(false)
  })

  it('wraps each mark with renderMark and makes the marks answer Enter and Space', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(
      <Highlight query="b" renderMark={(mark) => cloneElement(mark, { onClick: onOpen })}>
        abc
      </Highlight>,
    )

    await user.tab()
    expect(screen.getByRole('button', { name: 'b' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onOpen).toHaveBeenCalledTimes(2)
  })
})
