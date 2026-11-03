import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DiffView } from '../diff-view'

function marksOf(container: HTMLElement) {
  return [...container.querySelectorAll('[data-slot="diff-mark"]')]
}

describe('DiffView', () => {
  it('strikes the words that left in del, and fills the words that came in ins', () => {
    const { container } = render(
      <DiffView
        before="The system shall let a student search mentors."
        after="The system shall let a student find mentors."
      />,
    )

    expect(marksOf(container).map((mark) => [mark.tagName, mark.textContent])).toEqual([
      ['DEL', 'search'],
      ['INS', 'find'],
    ])
    // The mark of the words that left reads where they stood, right before the words that came.
    expect(container.textContent).toBe('The system shall let a student searchfind mentors.')
  })

  it('reads as the after when nothing was removed', () => {
    const { container } = render(<DiffView before="" after="Added by the analyst." />)

    expect(marksOf(container).map((mark) => mark.textContent)).toEqual(['Added by the analyst.'])
  })

  it('reads as the before when nothing came', () => {
    const { container } = render(<DiffView before="Deleted before the run went on." after="" />)

    expect(marksOf(container).map((mark) => mark.textContent)).toEqual([
      'Deleted before the run went on.',
    ])
  })

  it('marks nothing when the texts read the same', () => {
    const { container } = render(
      <DiffView before="Nothing changed here." after="Nothing changed here." />,
    )

    expect(marksOf(container)).toHaveLength(0)
    expect(screen.getByText('Nothing changed here.')).toBeInTheDocument()
  })
})
