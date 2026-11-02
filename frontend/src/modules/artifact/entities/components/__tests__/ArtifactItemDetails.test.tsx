import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import type { ItemStatus } from '../../status/item-status.types'
import { ArtifactItemDetails } from '../ArtifactItemDetails'

const requirement = itemFixtureByKey(projectIds.mentor, 'REQ-001')
const schema = contentSchemaFixtureByKind('spec_requirement')

function renderDetails(status: ItemStatus, isUnderReview = false) {
  return renderWithProviders(
    <ArtifactItemDetails
      item={requirement}
      schema={schema}
      status={status}
      isUnderReview={isUnderReview}
    />,
  )
}

describe('ArtifactItemDetails', () => {
  it('shows the status, the key and the version in one line', () => {
    renderDetails('approved')

    expect(screen.getByText('REQ-001')).toBeInTheDocument()
    expect(screen.getByText(/Approved/)).toBeInTheDocument()
    expect(screen.getByText(`version ${String(requirement.version)}`)).toBeInTheDocument()
  })

  it('shows the filled fields with their label above their value, and hides the empty ones', () => {
    renderDetails('approved')

    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(1)
    for (const heading of screen.getAllByRole('heading', { level: 2 })) {
      expect(heading).not.toBeEmptyDOMElement()
    }
  })

  it('writes the status in the color of its level', () => {
    renderDetails('draft', true)

    expect(screen.getByText('Needs your review')).toHaveClass('text-(--tone-strong)')
  })

  it('writes a rejected item muted', () => {
    renderDetails('rejected')

    expect(screen.getByText(/Rejected/)).toHaveAttribute('data-color', 'muted')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderDetails('approved')

    await expectNoAccessibilityViolations(container)
  })
})
