import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import type { ItemStatus } from '@/modules/artifact/entities'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { itemPageViewOf } from '../../item-layout.utils'
import { ItemKeyLine } from '../ItemKeyLine'

const requirement = itemFixtureByKey(projectIds.mentor, 'REQ-001')
const requirementView = itemPageViewOf(contentSchemaFixtureByKind('spec_requirement'))
const persona = itemFixtureByKey(projectIds.mentor, 'PER-001')
const personaView = itemPageViewOf(contentSchemaFixtureByKind('persona'))

function renderKeyLine(status: ItemStatus, isUnderReview = false) {
  return renderWithProviders(
    <ItemKeyLine item={requirement} status={status} isUnderReview={isUnderReview} />,
  )
}

describe('ItemKeyLine', () => {
  it('names the item by its status, with its version and its key last', () => {
    renderWithProviders(
      <ItemKeyLine
        item={requirement}
        status="approved"
        isUnderReview={false}
        fields={requirementView.keyLineFields}
      />,
    )

    const line = screen.getByText(/Approved/).closest('p')
    if (line === null) throw new Error('The key line lost its line')
    expect(line).toHaveTextContent(/version \d/)
    expect(line).toHaveTextContent('REQ-001')
    expect(screen.getByText('REQ-001')).toHaveClass('text-muted-foreground')
  })

  it('names the item while the fields of its key line are not known yet', () => {
    renderKeyLine('approved')

    expect(screen.getByText(/Approved/)).toBeInTheDocument()
    expect(screen.getByText('REQ-001')).toBeInTheDocument()
  })

  it('shows the fields of one line of a persona above the label of its status', () => {
    renderWithProviders(
      <ItemKeyLine
        item={persona}
        status="approved"
        isUnderReview={false}
        fields={personaView.keyLineFields}
      />,
    )

    const stakeholder = screen.getByText('Student').closest('p')
    const status = screen.getByText(/Approved/).closest('p')
    if (stakeholder === null || status === null) throw new Error('The key line lost a line')
    expect(stakeholder.textContent).toContain('Stakeholder type: Student')
    expect(screen.getByText('Interviewed')).toBeInTheDocument()
    expect(stakeholder).not.toBe(status)
    expect(stakeholder.compareDocumentPosition(status)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
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
