import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, expectText } from '@/test/steps'

import { useArtifactDocument } from '../../outline/hooks/useArtifactDocument'
import { ArtifactDocument } from '../ArtifactDocument'

const projectId = projectIds.mentor
const renderItemLink = (item: { key: string }, title: React.ReactNode) => (
  <a href={`/items/${item.key}`}>{title}</a>
)

function LoadedDocument({
  artifactId,
  isUnderReview,
}: {
  artifactId: string
  isUnderReview: boolean
}) {
  const document = useArtifactDocument(artifactId)
  return document.state === 'success' ? (
    <ArtifactDocument
      data={document}
      renderItemLink={renderItemLink}
      isUnderReview={isUnderReview}
    />
  ) : null
}

function renderDocument(kind: string, { isUnderReview = false } = {}) {
  return renderWithProviders(
    <LoadedDocument
      artifactId={artifactFixtureByKind(projectId, kind).id}
      isUnderReview={isUnderReview}
    />,
  )
}

describe('ArtifactDocument', () => {
  it('shows a table for the items of a table kind, with the title as a link', async () => {
    renderDocument('requirements_analysis')

    const [table] = await screen.findAllByRole('table')
    expect(
      within(assertPresent(table, 'The document has no table')).getByRole('link', {
        name: /Find a mentor in my field/,
      }),
    ).toHaveAttribute('href', '/items/RAW-001')
  })

  it('shows cards for the items of a card kind', async () => {
    renderDocument('persona_catalog')

    expect(await screen.findByRole('link', { name: 'Student' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the messages of a transcript with their role', async () => {
    renderDocument('interview_transcript')

    expect(await screen.findByText('How do you look for a mentor today?')).toBeInTheDocument()
  })

  it('shows the fields of an artifact that has no items', async () => {
    renderDocument('elicitation_plan')

    expect(await screen.findByRole('heading', { name: 'Objectives' })).toBeInTheDocument()
  })

  it('shows the status line with the version', async () => {
    renderDocument('requirement_specification')

    await expectText(/^version \d+$/)
  })

  it('names the review that waits for the user in the color that asks for it', async () => {
    renderDocument('requirements_analysis', { isUnderReview: true })

    expect(await screen.findByText('Needs your review')).toHaveAttribute('data-color', 'warning')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderDocument('requirement_specification')
    await screen.findAllByRole('table')

    await expectNoAccessibilityViolations(container)
  })
})
