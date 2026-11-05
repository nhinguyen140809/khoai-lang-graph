import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { renderWithProviders } from '@/test/render'

import { ItemHeading } from '../ItemHeading'

const persona = itemFixtureByKey(projectIds.mentor, 'PER-001')

describe('ItemHeading', () => {
  it('leads the title of a persona with its avatar, in the tone of its place', () => {
    renderWithProviders(
      <ItemHeading
        item={persona}
        schema={contentSchemaFixtureByKind('persona')}
        title="Minh"
        place={1}
      />,
    )

    const heading = screen.getByRole('heading', { level: 1, name: 'Minh' })
    // The key of the item sits right after its title.
    expect(heading.parentElement).toHaveTextContent('PER-001')
    const avatar = screen.getByText('M').closest('[data-slot="avatar"]')
    expect(avatar).toBeInTheDocument()
    expect(avatar?.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText('M')).toHaveAttribute('data-color', 'chart')
    expect(screen.getByText('M')).toHaveAttribute('data-variant', 'soft')
  })

  it('draws the title alone for a kind whose page has no avatar', () => {
    renderWithProviders(
      <ItemHeading
        item={itemFixtureByKey(projectIds.mentor, 'REQ-001')}
        schema={contentSchemaFixtureByKind('spec_requirement')}
        title="Search mentors"
        place={1}
      />,
    )

    const heading = screen.getByRole('heading', { level: 1, name: 'Search mentors' })
    expect(heading.parentElement).toHaveTextContent('REQ-001')
    expect(screen.queryByText('M')).not.toBeInTheDocument()
  })
})
