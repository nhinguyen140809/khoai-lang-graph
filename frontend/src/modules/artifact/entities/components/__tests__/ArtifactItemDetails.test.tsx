import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import type { ItemStatus } from '../../status/item-status.types'
import { ArtifactItemDetails, ItemKeyLine } from '../ArtifactItemDetails'

const requirement = itemFixtureByKey(projectIds.mentor, 'REQ-001')
const schema = contentSchemaFixtureByKind('spec_requirement')
const persona = itemFixtureByKey(projectIds.mentor, 'PER-001')
const personaSchema = contentSchemaFixtureByKind('persona')

function renderKeyLine(status: ItemStatus, isUnderReview = false) {
  return renderWithProviders(
    <ItemKeyLine item={requirement} status={status} isUnderReview={isUnderReview} />,
  )
}

/** The details with the marks that a page adds. */
function renderWithMarks() {
  return renderWithProviders(
    <ArtifactItemDetails
      item={requirement}
      schema={schema}
      fieldMarks={new Map([['statement', [{ start: 17, end: 45 }]]])}
      renderFieldMark={(range, children) => <em key={range.start}>{children}</em>}
    />,
  )
}

describe('ItemKeyLine', () => {
  it('shows the status and the key in one line', () => {
    renderKeyLine('approved')

    expect(screen.getByText('REQ-001')).toBeInTheDocument()
    expect(screen.getByText(/Approved/)).toBeInTheDocument()
    expect(screen.queryByText(/^version /)).not.toBeInTheDocument()
  })

  it('follows the key with the fields of one line of a persona, in their order', () => {
    renderWithProviders(
      <ItemKeyLine item={persona} status="approved" isUnderReview={false} schema={personaSchema} />,
    )

    const line = screen.getByText('PER-001').closest('p')
    expect(line?.textContent).toContain('Stakeholder type: Student')
    expect(screen.getByText('Interviewed')).toBeInTheDocument()
    expect(screen.queryByText('Background')).not.toBeInTheDocument()
  })

  it('writes the status in the color of its level', () => {
    renderKeyLine('draft', true)

    expect(screen.getByText('Needs your review')).toHaveClass('text-(--tone-strong)')
  })

  it('writes a rejected item muted', () => {
    renderKeyLine('rejected')

    expect(screen.getByText(/Rejected/)).toHaveAttribute('data-color', 'muted')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderKeyLine('approved')

    await expectNoAccessibilityViolations(container)
  })
})

describe('ArtifactItemDetails', () => {
  it('shows the filled fields with their label above their value, and hides the empty ones', () => {
    renderWithMarks()

    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(1)
    for (const heading of screen.getAllByRole('heading', { level: 2 })) {
      expect(heading).not.toBeEmptyDOMElement()
    }
  })

  it('passes the marks of a field to its value, wrapped by the wrapper of the page', () => {
    renderWithMarks()

    const marked = screen.getByText('let a student search mentors')
    expect(marked.closest('em')).not.toBeNull()
    expect(marked.closest('mark')).not.toBeNull()
  })

  it('has no accessibility violation', async () => {
    const { container } = renderWithMarks()

    await expectNoAccessibilityViolations(container)
  })
})

describe('ArtifactItemDetails of a profile', () => {
  it('draws the body without the name, the stakeholder type and the status, each list in one column and each text across', () => {
    renderWithProviders(<ArtifactItemDetails item={persona} schema={personaSchema} />)

    expect(screen.queryByRole('heading', { name: 'Name' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Stakeholder type' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Interview status' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Background' })).toBeInTheDocument()
    const goals = screen.getByRole('heading', { name: 'Goals' }).closest('section')
    expect(goals).not.toHaveAttribute('data-wide')
    const background = screen.getByRole('heading', { name: 'Background' }).closest('section')
    expect(background).toHaveAttribute('data-wide')
  })

  it('keeps the marks of the fields on the page of a profile', () => {
    renderWithProviders(
      <ArtifactItemDetails
        item={persona}
        schema={personaSchema}
        fieldMarks={new Map([['background', [{ start: 0, end: 11 }]]])}
        renderFieldMark={(range, children) => <em key={range.start}>{children}</em>}
      />,
    )

    const marked = screen.getByText('Third-year')
    expect(marked.closest('em')).not.toBeNull()
    expect(marked.closest('mark')).not.toBeNull()
  })
})
