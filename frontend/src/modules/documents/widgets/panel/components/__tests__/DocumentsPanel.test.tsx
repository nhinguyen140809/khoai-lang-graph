import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderDocumentsFrame } from '@/test/render'
import { expectNoAccessibilityViolations, expectNoText, expectRole, expectText } from '@/test/steps'

const projectId = projectIds.mentor
const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
const documentsPath = `/projects/${projectId}/documents`

function renderPanel({ artifactId, scenario }: { artifactId?: string; scenario?: string } = {}) {
  return renderDocumentsFrame(<p>The page</p>, {
    pathname: artifactId === undefined ? documentsPath : `${documentsPath}/${artifactId}`,
    params: artifactId === undefined ? {} : { artifactId },
    ...(scenario !== undefined && { scenario }),
  })
}

/** The row of the tree with this title, once the tree shows. */
function findRow(name: string) {
  return screen.findByRole('treeitem', { name })
}

/** The letter at the end of a row, which the title does not hold. */
function letterOf(row: HTMLElement) {
  return row.querySelector('[aria-hidden="true"].font-mono')?.textContent ?? ''
}

// The panel shows in the frame, on the activity bar of the project, beside a page.
describe('DocumentsPanel icons', () => {
  it('shows before the title of a document the icon of what it is made of', async () => {
    renderPanel()

    const persona = await findRow('Persona catalog')
    await waitFor(() => {
      expect(persona.querySelector('svg.lucide-layout-grid')).not.toBeNull()
    })
    const analysisRow = await findRow('Requirements analysis')
    expect(analysisRow.querySelector('svg.lucide-table')).not.toBeNull()
  })

  it('shows no icon before the title of a group', async () => {
    renderPanel()

    const group = await findRow('Interview transcript')

    expect(group.querySelector('svg.lucide-messages-square')).toBeNull()
  })
})

describe('DocumentsPanel tooltips', () => {
  it('names a document by its full title, with its status under it', async () => {
    renderPanel()

    await userEvent.hover(within(await findRow('Persona catalog')).getByText('Persona catalog'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Persona catalogApproved, version 2',
    )
  })

  it('ends the path of a row with its own title, so a title cut short reads in full', async () => {
    renderPanel({ artifactId: analysis.id })

    await userEvent.hover(
      within(await findRow('Session length unknown')).getByText('Session length unknown'),
    )

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Requirements analysis / Point to clarify / Session length unknownIssue to resolve',
    )
  })
})

describe('DocumentsPanel states', () => {
  it('shows a loading state while the documents load', async () => {
    renderPanel({ scenario: '/?mock-artifacts=loading' })

    await expectRole('status', 'Loading the documents')
  })

  it('shows an error with a way to try again', async () => {
    renderPanel({ scenario: '/?mock-artifacts=error' })

    await expectText('The documents could not load.')
    await expectRole('button', 'Try again')
  })

  it('shows an empty state when there is no document and the run is done', async () => {
    renderPanel({ scenario: '/?mock-artifacts=empty&mock-run-status=done' })

    await expectText('No documents yet')
  })

  it('lists every kind as not started while the run goes on without any document', async () => {
    renderPanel({ scenario: '/?mock-artifacts=empty&mock-run-status=running' })

    const row = await findRow('Interview plan')
    await waitFor(() => {
      expect(row.querySelector('[data-color="muted"]')).not.toBeNull()
    })
    expect(letterOf(row)).toBe('')
  })
})

describe('DocumentsPanel marks', () => {
  it('shows R at the end of a document that waits for the review of the user', async () => {
    renderPanel()

    const row = await findRow(analysis.title)

    await waitFor(() => {
      expect(letterOf(row)).toBe('R')
    })
    expect(within(row).getByText(analysis.title)).toHaveClass('text-(--tone-strong)')
  })

  it('shows W at the end of a document being written, in the color of what changes', async () => {
    renderPanel({ scenario: '/?mock-run-status=running' })

    const row = await findRow(analysis.title)

    expect(letterOf(row)).not.toBe('R')
  })

  it('shows no letter at the end of an approved document', async () => {
    renderPanel()

    const row = await findRow('Persona catalog')

    expect(letterOf(row)).toBe('')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderPanel({ artifactId: analysis.id })
    await findRow(analysis.title)

    await expectNoAccessibilityViolations(container)
  })
})

describe('DocumentsPanel opening', () => {
  it('opens a document on a click', async () => {
    renderPanel()

    await userEvent.click(await findRow(analysis.title))

    expect(routerMock.push).toHaveBeenCalledWith(`${documentsPath}/${analysis.id}`)
  })

  it('opens a document again on a double click, which keeps its tab', async () => {
    renderPanel()

    await userEvent.dblClick(await findRow(analysis.title))

    expect(routerMock.push).toHaveBeenCalledWith(`${documentsPath}/${analysis.id}`)
  })
})

describe('DocumentsPanel outline', () => {
  it('shows the outline of the open document under its row', async () => {
    renderPanel({ artifactId: analysis.id })

    await findRow('Stated need')
    expect(await findRow(analysis.title)).toHaveAttribute('aria-current', 'page')
  })

  it('shows a loading row while the outline loads, and an error row that tries again', async () => {
    renderPanel({ artifactId: analysis.id, scenario: '/?mock-artifact=error' })

    await userEvent.click(await findRow('The outline could not load.'))

    await findRow('The outline could not load.')
  })

  it('colors the drafts of a document under review and no others', async () => {
    renderPanel({ artifactId: analysis.id })

    const draft = await findRow('Cancel without writing')

    await waitFor(() => {
      expect(within(draft).getByText(/Cancel without writing/)).toHaveClass('text-(--tone-strong)')
    })
    expect(letterOf(draft)).toBe('')
  })

  it.each([
    {
      name: 'a rejected item',
      title: 'Approve a booking too',
      letter: 'X',
      isMuted: true,
    },
    {
      name: 'an item edited by the user',
      title: 'Reminder before a session',
      letter: 'E',
      isMuted: false,
    },
    {
      name: 'an open issue',
      title: 'Session length unknown',
      letter: '?',
      isMuted: false,
    },
  ])('shows the letter of $name at the end of its row', async ({ title, letter, isMuted }) => {
    renderPanel({ artifactId: analysis.id })

    const row = await findRow(title)

    await waitFor(() => {
      expect(letterOf(row)).toBe(letter)
    })
    if (isMuted) expect(within(row).getByText(title)).toHaveAttribute('data-color', 'muted')
  })

  it('collapses a group with its count and the color of the highest level under it', async () => {
    renderPanel({ artifactId: analysis.id })
    const group = await findRow('Stated need')

    await userEvent.click(group)

    await waitFor(() => {
      expect(within(group).getByText('Stated need')).toHaveClass('text-(--tone-strong)')
    })
    expect(within(group).getByText('8')).toBeInTheDocument()
  })

  it('counts what asks something of the user in the footer, and opens the first item of a state', async () => {
    renderPanel({ artifactId: analysis.id })

    const button = await screen.findByRole('button', { name: /to review/ })
    await userEvent.click(button)

    expect(routerMock.push).toHaveBeenCalledWith(expect.stringMatching(/\/items\//))
  })

  it('renders no footer for a document with nothing to count', async () => {
    renderPanel({ artifactId: artifactFixtureByKind(projectId, 'persona_catalog').id })

    await findRow('Student')
    expectNoText(/to review/)
    expect(document.querySelector('aside .border-t')).toBeNull()
  })
})
