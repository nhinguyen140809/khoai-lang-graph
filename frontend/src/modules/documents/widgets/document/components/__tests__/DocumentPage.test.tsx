import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderDocumentsFrame } from '@/test/render'
import { expectNoAccessibilityViolations, expectRole, expectText } from '@/test/steps'

import { DocumentPage } from '../DocumentPage'
import { DocumentsHomePage } from '../DocumentsHomePage'

const projectId = projectIds.mentor
const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
const interview = artifactFixtureByKind(projectId, 'interview_transcript', 'Interview with Minh')
const documentsPath = `/projects/${projectId}/documents`

function renderDocument(artifactId: string, scenario?: string) {
  return renderDocumentsFrame(<DocumentPage projectId={projectId} artifactId={artifactId} />, {
    pathname: `${documentsPath}/${artifactId}`,
    params: { artifactId },
    ...(scenario !== undefined && { scenario }),
  })
}

/** The tab of the strip with this title, once the page opened it. */
async function findTab(title: string) {
  const strip = await screen.findByRole('navigation', { name: 'Open editors' })
  return (await within(strip).findByText(title)).closest('li') as HTMLElement
}

describe('DocumentPage', () => {
  it('shows the title, the status line and the groups of the document', async () => {
    renderDocument(analysis.id)

    expect(
      await screen.findByRole('heading', { level: 1, name: analysis.title }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Stated need/ })).toBeInTheDocument()
  })

  it('opens a tab titled with the document, with the icon of a review while it waits for one', async () => {
    renderDocument(analysis.id)

    const tab = await findTab(analysis.title)
    await waitFor(() => {
      expect(tab.querySelector('[data-color="warning"]')).not.toBeNull()
    })
  })

  it('opens a tab for a document that does not exist, with the state in it', async () => {
    renderDocument('missing-document')

    expect(await screen.findByText('Document not found')).toBeInTheDocument()
    await findTab('Document')
  })

  it('gives the tab of a document the icon of what the document is made of', async () => {
    const personas = artifactFixtureByKind(projectId, 'persona_catalog')
    renderDocument(personas.id)

    const tab = await findTab(personas.title)
    await waitFor(() => {
      expect(tab.querySelector('svg.lucide-users')).not.toBeNull()
    })
  })

  it('opens a tab named by the list for a document that fails to load, with the error in it', async () => {
    renderDocument(analysis.id, '/?mock-artifact=error')

    expect(await screen.findByText('The document could not load.')).toBeInTheDocument()
    await findTab(analysis.title)
  })

  it('opens the tab of an approved document with the icon of a document', async () => {
    const persona = artifactFixtureByKind(projectId, 'persona_catalog')
    renderDocument(persona.id)

    const tab = await findTab(persona.title)
    expect(tab.querySelector('[data-color="warning"]')).toBeNull()
  })

  it('opens the page of an item on a click on its title, and keeps its tab on a double click', async () => {
    renderDocument(analysis.id)
    const item = itemFixtureByKey(projectId, 'RAW-001')
    const href = `/projects/${projectId}/items/${item.id}`

    const link = await screen.findByRole('link', { name: /Find a mentor in my field/ })
    await userEvent.click(link)
    expect(routerMock.push).toHaveBeenCalledWith(href)

    routerMock.push.mockClear()
    await userEvent.dblClick(link)
    expect(routerMock.push).toHaveBeenCalledWith(href)
  })

  it('opens the page of a persona from the participants of a transcript', async () => {
    renderDocument(interview.id)
    const persona = itemFixtureByKey(projectId, 'PER-001')

    const link = await screen.findByRole('link', { name: 'Minh' })
    expect(link).toHaveAttribute('href', `/projects/${projectId}/items/${persona.id}`)
    await userEvent.click(link)
    expect(routerMock.push).toHaveBeenCalledWith(`/projects/${projectId}/items/${persona.id}`)
  })

  it('shows a loading state while the document loads', async () => {
    renderDocument(analysis.id, '/?mock-artifact=loading')

    await expectRole('status', 'Loading the document')
  })

  it('shows a not found state for a document that does not exist', async () => {
    renderDocument('missing-artifact')

    await expectText('Document not found')
  })

  it('shows an error with a way to try again when the document fails to load', async () => {
    renderDocument(analysis.id, '/?mock-artifact=error')

    await expectRole('button', 'Try again')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderDocument(analysis.id)
    await screen.findByRole('heading', { name: /Stated need/ })

    await expectNoAccessibilityViolations(container)
  })
})

describe('DocumentsHomePage', () => {
  it('asks to choose a document in the side panel', async () => {
    renderDocumentsFrame(<DocumentsHomePage />, { pathname: documentsPath })

    await expectText('Choose a document')
  })
})
