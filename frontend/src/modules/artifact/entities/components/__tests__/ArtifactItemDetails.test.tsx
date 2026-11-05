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

/** The details with the slots and the marks that a page adds. */
function renderWithSlots() {
  return renderWithProviders(
    <ArtifactItemDetails
      item={requirement}
      schema={schema}
      status="approved"
      isUnderReview={false}
      afterKeyLine={<a href="/links">Based on AR-001</a>}
      fieldMarks={new Map([['statement', [{ start: 17, end: 45 }]]])}
      renderFieldMark={(range, children) => <em key={range.start}>{children}</em>}
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

describe('ArtifactItemDetails with the slots of a page', () => {
  it('draws what the page gives under the key line', () => {
    renderWithSlots()

    const link = screen.getByRole('link', { name: 'Based on AR-001' })
    expect(link).toBeInTheDocument()
  })

  it('passes the marks of a field to its value, wrapped by the wrapper of the page', () => {
    renderWithSlots()

    const marked = screen.getByText('let a student search mentors')
    expect(marked.closest('em')).not.toBeNull()
    expect(marked.closest('mark')).not.toBeNull()
  })
})
