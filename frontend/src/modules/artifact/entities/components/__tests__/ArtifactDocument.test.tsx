import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { useArtifactDocument } from '../../outline/hooks/useArtifactDocument'
import { ArtifactDocument } from '../ArtifactDocument'

const mentorProjectId = projectIds.mentor
const libraryProjectId = projectIds.library
const renderItemLink = (item: { key: string }, title: React.ReactNode) => (
  <a href={`/items/${item.key}`}>{title}</a>
)
const renderItemIdLink = (itemId: string, children: React.ReactNode) => (
  <a key={itemId} href={`/participants/${itemId}`}>
    {children}
  </a>
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
      renderItemIdLink={renderItemIdLink}
      {...slots}
    />
  ) : null
}

function renderDocument(
  kind: string,
  {
    projectId = mentorProjectId,
    isUnderReview = false,
    slots,
  }: {
    projectId?: string
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

  it('shows avatar cards for the items of a profile kind, with the badge of each person', async () => {
    renderDocument('persona_catalog')

    const links = await screen.findAllByRole('link')
    expect(links.map((link) => link.textContent)).toContain('Minh')
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(3)
    expect(screen.getAllByText('Interviewed').length).toBe(3)
    expect(
      screen.getByText('Third-year undergraduate who wants advice on a research career.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Goals:/).length).toBe(3)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the badge of a persona that is not interviewed yet', async () => {
    renderDocument('persona_catalog', { projectId: libraryProjectId })

    expect(await screen.findByText('Not interviewed')).toBeInTheDocument()
  })

  it('shows the fields of an artifact that has no items', async () => {
    renderDocument('elicitation_plan')

    expect(await screen.findByRole('heading', { name: 'Objectives' })).toBeInTheDocument()
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

describe('ArtifactDocument of a transcript', () => {
  it('lists the fields that are not separators, with the participants as links to their item', async () => {
    renderDocument('interview_transcript')

    const list = assertPresent(
      await screen.findByText('Participants'),
      'The transcript shows no list of fields',
    ).closest('dl')
    expect(screen.getByText('Turns')).toBeInTheDocument()
    expect(screen.getByText('Turns').closest('div')?.textContent).toContain('4')
    expect(
      within(assertPresent(list, 'No list of fields')).getByText('Interviewer'),
    ).toBeInTheDocument()
    const student = screen.getByRole('link', { name: 'Minh' })
    expect(student).toHaveAttribute('data-variant', 'outline')
    expect(student).toHaveAttribute(
      'href',
      `/participants/${itemFixtureByKey(mentorProjectId, 'PER-001').id}`,
    )
    expect(screen.queryByRole('link', { name: 'Interviewer' })).not.toBeInTheDocument()
  })

  it('draws the conversation of its participants with a separator for each turn', async () => {
    renderDocument('interview_transcript')

    const first = await screen.findByText('How do you look for a mentor today?')
    for (const turn of ['Turn 1', 'Turn 2', 'Turn 3', 'Turn 4']) {
      expect(screen.getByText(turn)).toBeInTheDocument()
    }
    // The interviewer, who leads, sits at the right; the student at the left.
    expect(first.closest('[data-slot="message"]')).toHaveAttribute('data-align', 'end')
    const answer = screen.getByText(
      'I ask seniors in my club, but I never know who is free this week, so I give up.',
    )
    expect(answer.closest('[data-slot="message"]')).toHaveAttribute('data-align', 'start')
    // The conversation has no heading of the kind of its messages.
    expect(screen.queryByRole('heading', { name: /Interview message/ })).not.toBeInTheDocument()
  })

  it('ends with the separator of the artifact, after the last message', async () => {
    renderDocument('interview_transcript')

    const last = await screen.findByText(
      'Fast. I do not wait for a page that takes more than a couple of seconds.',
    )
    const separator = screen.getByText('Completed').closest('[data-slot="marker"]')
    expect(separator).not.toBeNull()
    expect(last.compareDocumentPosition(assertPresent(separator, 'No end separator'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(screen.getByText('Stopping condition reached')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Status' })).not.toBeInTheDocument()
  })

  it('ends with the status alone while the interview runs', async () => {
    renderDocument('interview_transcript', { projectId: libraryProjectId })

    expect(await screen.findByText('How do you book a study room today?')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.queryByText('Stopping condition reached')).not.toBeInTheDocument()
  })

  it('takes the version of the history in place of the list, without the end separator', async () => {
    renderDocument('interview_transcript', {
      slots: { fieldsView: <p>The version of the history shows here.</p> },
    })

    expect(await screen.findByText('The version of the history shows here.')).toBeInTheDocument()
    expect(screen.queryByText('Participants')).not.toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('anchors the bubble of a message and marks the target one', async () => {
    const message = itemFixtureByKey(mentorProjectId, 'PER-001#2')
    renderDocument('interview_transcript', {
      slots: {
        targetItemId: message.id,
        messageMarks: new Map([[message.id, [{ start: 0, end: 5 }]]]),
        renderMessageMark: (range, children) => <em key={range.start}>{children}</em>,
      },
    })

    const block = await waitFor(() => {
      const found = document.getElementById(`item-${message.id}`)
      if (found === null) throw new Error('The bubble of the message has no anchor')
      return found
    })
    expect(block).toHaveAttribute('tabindex', '-1')
    expect(block).toHaveAttribute('data-target', '')
    // The quoted words of the message are marked, wrapped by the wrapper of the page.
    const marked = block.querySelector('mark')
    expect(marked).not.toBeNull()
    expect(marked?.closest('em')).not.toBeNull()
  })

  it('has no accessibility violation on the conversation', async () => {
    const { container } = renderDocument('interview_transcript')
    await screen.findByText('How do you look for a mentor today?')

    await expectNoAccessibilityViolations(container)
  })

  it('has no accessibility violation on the avatar cards', async () => {
    const { container } = renderDocument('persona_catalog')
    await screen.findAllByRole('heading', { level: 3 })

    await expectNoAccessibilityViolations(container)
  })
})

describe('ArtifactDocument with the slots of a page', () => {
  it('places the actions at the right of the title, and the fields view in place of the fields', async () => {
    renderDocument('elicitation_plan', {
      slots: {
        actions: <button type="button">Edit</button>,
        fieldsView: <p>The version of the history shows here.</p>,
      },
    })

    const edit = await screen.findByRole('button', { name: 'Edit' })
    expect(edit.closest('div')?.querySelector('h1')).not.toBeNull()
    expect(screen.getByText('The version of the history shows here.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Objectives' })).not.toBeInTheDocument()
  })
})
