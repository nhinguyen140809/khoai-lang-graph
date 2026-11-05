import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
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
  slots = {},
}: {
  artifactId: string
  isUnderReview: boolean
  slots?: Partial<Parameters<typeof ArtifactDocument>[0]> | undefined
}) {
  const document = useArtifactDocument(artifactId)
  return document.state === 'success' ? (
    <ArtifactDocument
      data={document}
      renderItemLink={renderItemLink}
      isUnderReview={isUnderReview}
      {...slots}
    />
  ) : null
}

function renderDocument(
  kind: string,
  {
    isUnderReview = false,
    slots,
  }: {
    isUnderReview?: boolean
    slots?: Partial<Parameters<typeof ArtifactDocument>[0]> | undefined
  } = {},
) {
  return renderWithProviders(
    <LoadedDocument
      artifactId={artifactFixtureByKind(projectId, kind).id}
      isUnderReview={isUnderReview}
      slots={slots}
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

  it('shows the messages of a transcript with their role, and no link for a message', async () => {
    renderDocument('interview_transcript')

    expect(await screen.findByText('How do you look for a mentor today?')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
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

describe('ArtifactDocument with the slots of a page', () => {
  it('anchors every block of an item and marks the target one', async () => {
    const message = itemFixtureByKey(projectId, 'PER-001#2')
    renderDocument('interview_transcript', {
      slots: {
        targetItemId: message.id,
        messageMarks: new Map([[message.id, [{ start: 0, end: 5 }]]]),
        renderMessageMark: (range, children) => <em key={range.start}>{children}</em>,
      },
    })

    const block = await waitFor(() => {
      const found = document.getElementById(`item-${message.id}`)
      if (found === null) throw new Error('The block of the message has no anchor')
      return found
    })
    expect(block).toHaveAttribute('tabindex', '-1')
    expect(block).toHaveAttribute('data-target', '')
    // The quoted words of the message are marked, wrapped by the wrapper of the page.
    const marked = block.querySelector('mark')
    expect(marked).not.toBeNull()
    expect(marked?.closest('em')).not.toBeNull()
  })
})
