import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'

import { ItemHeading } from '../ItemHeading'

describe('ItemHeading', () => {
  it('leads the title with its avatar when the page layout has one, in the tone of its place', () => {
    renderWithProviders(<ItemHeading hasAvatar title="Minh" place={1} />)

    const heading = screen.getByRole('heading', { level: 1, name: 'Minh' })
    // The key of the item sits on the key line, no longer beside its title.
    expect(heading.parentElement).not.toHaveTextContent('PER-001')
    const avatar = screen.getByText('M').closest('[data-slot="avatar"]')
    expect(avatar).toBeInTheDocument()
    expect(avatar?.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText('M')).toHaveAttribute('data-color', 'chart')
    expect(screen.getByText('M')).toHaveAttribute('data-variant', 'soft')
  })

  it('draws the title alone when the page layout has no avatar', () => {
    renderWithProviders(<ItemHeading hasAvatar={false} title="Search mentors" place={1} />)

    const heading = screen.getByRole('heading', { level: 1, name: 'Search mentors' })
    expect(heading.parentElement).not.toHaveTextContent('REQ-001')
    expect(screen.queryByText('M')).not.toBeInTheDocument()
  })
})
