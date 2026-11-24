import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import {
  type ChatReference,
  useReferenceOpener,
  useRevealReference,
} from '@/modules/activity/entities'
import { Desk } from '@/shared/components/frame'
import { routeOfAddress } from '@/shared/routes'
import { routerMock, setPathname, setQuery } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectAttribute,
  expectNoRole,
  expectPushedTo,
  expectReplacedWith,
  expectRole,
  expectText,
  press,
  pressButton,
} from '@/test/steps'

import { DocumentsTool } from '../DocumentsTool'
import { ReaderSplit } from '../ReaderSplit'

const projectId = projectIds.mentor
const chat = `/projects/${projectId}`
const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
const searchItem = itemFixtureByKey(projectId, 'AR-003')

/** A control of the chat that opens one reference, as a message of the chat does. */
function OpenReference({ reference }: { reference: ChatReference }) {
  const open = useReferenceOpener(reference)
  return (
    <button type="button" onClick={() => open?.()}>
      Open
    </button>
  )
}

/** A control of the chat that offers the analysis, as a review that asks to read it would. */
function RevealAnalysis() {
  const reveal = useRevealReference()
  return (
    <button
      type="button"
      onClick={() => {
        reveal(
          { kind: 'document', artifactId: analysis.id },
          'The review asks you to read the analysis',
        )
      }}
    >
      Reveal
    </button>
  )
}

/** Renders the chat of a project with its reader, at an address with this query; the mentor project by default. */
function renderSplit(query: string, id: string = projectId) {
  setPathname(`/projects/${id}`)
  setQuery(query)
  renderWithProviders(
    <ReaderSplit projectId={id}>
      <p>The chat</p>
      <OpenReference reference={{ kind: 'document', artifactId: analysis.id }} />
      <RevealAnalysis />
    </ReaderSplit>,
  )
}

/** Renders the tool of the documents in the desk, which shows it as a button with its name. */
function renderTool() {
  renderWithProviders(
    <Desk homeHref={routeOfAddress('/')} sidebar={null} accountMenu={null}>
      <DocumentsTool />
    </Desk>,
  )
}

/** Makes the screen as narrow as a phone. */
function narrowTheScreen() {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

describe('ReaderSplit', () => {
  it('shows the chat alone while the address names no reference', async () => {
    renderSplit('')

    await expectText('The chat')
    expectNoRole('complementary')
  })

  it('opens a reference of the chat by naming it in the address', async () => {
    renderSplit('')

    await pressButton('Open')

    await expectPushedTo(`${chat}?document=${analysis.id}`, { scroll: false })
  })

  it('shows the document beside the chat, which stays, as the blocks of its folders', async () => {
    renderSplit(`document=${analysis.id}`)

    const reader = await screen.findByRole('complementary', { name: analysis.title })
    await expectRole('heading', analysis.title, within(reader))
    const folder = await within(reader).findByRole('link', { name: /^Analysed requirement/ })
    expect(folder).toHaveAttribute(
      'href',
      `${chat}?document=${analysis.id}&folder=group%3Aroot%3Aanalyzed_requirement`,
    )
    await expectText('The chat')
    expectNoRole('dialog')
  })

  it('shows a folder of the document with its items opening in the reader', async () => {
    renderSplit(`document=${analysis.id}&folder=group%3Aroot%3Aanalyzed_requirement`)

    const reader = await screen.findByRole('complementary', { name: 'Analysed requirement' })
    const link = await within(reader).findByRole('link', { name: 'Search with free hours' })
    expect(link).toHaveAttribute('href', `${chat}?item=${searchItem.id}`)
  })

  it('shows the item that the address names, with its kind and its fields', async () => {
    renderSplit(`item=${searchItem.id}`)

    const reader = await screen.findByRole('complementary', { name: 'Search with free hours' })
    await expectRole('heading', 'Search with free hours', within(reader))
    // The kind of the item, and the folder of its kind in the path above it.
    expect(await within(reader).findAllByText('Analysed requirement')).toHaveLength(2)
    const path = within(reader).getByRole('navigation', { name: 'Where you are' })
    expect(within(path).getByRole('link', { name: 'Documents' })).toHaveAttribute(
      'href',
      `${chat}?reader=documents`,
    )
  })

  it('shows a persona in the reader as a profile: its avatar, its role and its status under its name, and its links folded at its foot', async () => {
    const persona = itemFixtureByKey(projectId, 'PER-001')
    renderSplit(`item=${persona.id}`)

    const reader = await screen.findByRole('complementary', { name: 'Minh' })
    const heading = await within(reader).findByRole('heading', { level: 1, name: 'Minh' })
    // The face of the persona leads the name, and the role and the status stand under it, with no key.
    expect(reader.querySelectorAll('[data-slot="human-face"]').length).toBe(1)
    expect(heading.parentElement).toHaveTextContent('Student')
    expect(heading.parentElement).toHaveTextContent('Interviewed')
    expect(heading.parentElement).not.toHaveTextContent('PER-001')
    // The links are folded, closed until they are opened.
    await expectRole('button', 'Related items', within(reader))
    expectAttribute('button', 'Related items', 'aria-expanded', 'false')
  })

  it('says that a document does not exist', async () => {
    renderSplit('document=missing')

    await expectRole('heading', 'Document not found')
  })

  it('leaves the address of the chat when the tool of the desk hides the reader', async () => {
    setPathname(chat)
    setQuery(`document=${analysis.id}`)
    renderTool()

    await pressButton('Documents')

    await expectReplacedWith(chat, { scroll: false })
  })

  it('lists the documents of the project, each opening in the reader, with the review that waits', async () => {
    renderSplit('reader=documents')

    const reader = await screen.findByRole('complementary', { name: 'Documents' })
    const link = await within(reader).findByRole('link', { name: /Requirements analysis/ })
    expect(link).toHaveAttribute('href', `${chat}?document=${analysis.id}`)
    expect(await within(reader).findByText('Waiting for your review')).toBeInTheDocument()
  })

  it('opens at once what is offered while the reader shows nothing', async () => {
    renderSplit('')

    await pressButton('Reveal')

    await expectPushedTo(`${chat}?document=${analysis.id}`, { scroll: false })
    expectNoRole('status')
  })

  it('asks first while the reader shows another view, and goes on reading meanwhile', async () => {
    renderSplit('reader=documents')
    await screen.findByRole('complementary', { name: 'Documents' })

    await pressButton('Reveal')

    const note = await screen.findByRole('status')
    expect(note).toHaveTextContent('The review asks you to read the analysis')
    expect(routerMock.push).not.toHaveBeenCalled()
    await press(within(note).getByRole('button', { name: 'Open' }))
    await expectPushedTo(`${chat}?document=${analysis.id}`, { scroll: false })
  })

  it('sets the offer aside when the user says not now, and leaves the reader as it was', async () => {
    renderSplit('reader=documents')
    await screen.findByRole('complementary', { name: 'Documents' })
    await pressButton('Reveal')
    await screen.findByRole('status')

    await pressButton('Not now')

    expectNoRole('status')
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('offers nothing about what the reader already shows', async () => {
    renderSplit(`document=${analysis.id}`)
    await screen.findByRole('complementary', { name: analysis.title })

    await pressButton('Reveal')

    expectNoRole('status')
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('lists the documents of one kind as a folder that opens them, even when it holds one', async () => {
    renderSplit('reader=documents')

    const reader = await screen.findByRole('complementary', { name: 'Documents' })
    const folder = await within(reader).findByRole('link', { name: /Interview transcript/ })
    expect(folder).toHaveAttribute('href', `${chat}?group=interview_transcript`)
  })

  it('shows the folder of one kind with a thumbnail that opens each of its documents', async () => {
    renderSplit('group=interview_transcript')

    const reader = await screen.findByRole('complementary', { name: 'Interview transcript' })
    await expectRole('heading', 'Interview transcript', within(reader))
    const trail = await within(reader).findByRole('navigation', { name: 'Where you are' })
    const links = (await within(reader).findAllByRole('link')).filter(
      (link) => !trail.contains(link) && link.textContent !== 'Up one level',
    )
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')).toContain(`${chat}?document=`)
  })

  it('goes up one level from the place that the path names, with no need of what the reader showed before', async () => {
    renderSplit('group=interview_transcript')

    const reader = await screen.findByRole('complementary', { name: 'Interview transcript' })

    expect(await within(reader).findByRole('link', { name: 'Up one level' })).toHaveAttribute(
      'href',
      `${chat}?reader=documents`,
    )
  })

  it('has no button to go up from the list of the documents', async () => {
    renderSplit('reader=documents')

    await screen.findByRole('complementary')

    expectNoRole('link', 'Up one level')
  })

  it('shows the path of the folder of one kind: the list, then the folder itself', async () => {
    renderSplit('group=interview_transcript')

    const reader = await screen.findByRole('complementary', { name: 'Interview transcript' })
    const trail = await within(reader).findByRole('navigation', { name: 'Where you are' })
    expect(within(trail).getByRole('link', { name: 'Documents' })).toHaveAttribute(
      'href',
      `${chat}?reader=documents`,
    )
    expect(within(trail).getByText('Interview transcript')).toHaveAttribute('aria-current', 'page')
  })

  it('puts the folder of its kind in the path of a document that is one of several', async () => {
    const transcript = artifactFixtureByKind(projectId, 'interview_transcript')
    renderSplit(`document=${transcript.id}`)

    const reader = await screen.findByRole('complementary', { name: transcript.title })
    const trail = await within(reader).findByRole('navigation', { name: 'Where you are' })
    expect(within(trail).getByRole('link', { name: 'Interview transcript' })).toHaveAttribute(
      'href',
      `${chat}?group=interview_transcript`,
    )
  })

  it('shows a subject that is not started muted, with no link and no name of its status', async () => {
    renderSplit('group=interview_transcript', projectIds.library)

    const reader = await screen.findByRole('complementary', { name: 'Interview transcript' })
    await waitFor(() => {
      expect(reader.querySelectorAll('[aria-disabled="true"]').length).toBeGreaterThan(0)
    })
    expect(within(reader).queryByText('Not started')).not.toBeInTheDocument()
  })

  it('opens the list of the documents from the tool of the desk', async () => {
    setPathname(chat)
    renderTool()

    await pressButton('Documents')

    await expectPushedTo(`${chat}?reader=documents`, { scroll: false })
  })

  it('opens the reader in a sheet over the chat on a narrow screen', async () => {
    narrowTheScreen()
    renderSplit(`document=${analysis.id}`)

    const sheet = await screen.findByRole('dialog', { name: analysis.title })
    await expectRole('heading', analysis.title, within(sheet))
    expectNoRole('complementary')
  })
})
