import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { type ChatReference, useReferenceOpener } from '@/modules/activity/entities'
import { setPathname, setQuery } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectNoRole,
  expectPushedTo,
  expectReplacedWith,
  expectRole,
  expectText,
  pressButton,
} from '@/test/steps'

import { DocumentsButton } from '../DocumentsButton'
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

/** Renders the chat of a project with its reader, at an address with this query; the mentor project by default. */
function renderSplit(query: string, id: string = projectId) {
  setPathname(`/projects/${id}`)
  setQuery(query)
  renderWithProviders(
    <ReaderSplit projectId={id}>
      <p>The chat</p>
      <OpenReference reference={{ kind: 'document', artifactId: analysis.id }} />
    </ReaderSplit>,
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

  it('says that a document does not exist', async () => {
    renderSplit('document=missing')

    await expectRole('heading', 'Document not found')
  })

  it('leaves the address of the chat when the button of the bar hides the reader', async () => {
    setPathname(chat)
    setQuery(`document=${analysis.id}`)
    renderWithProviders(<DocumentsButton />)

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
      (link) => !trail.contains(link),
    )
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')).toContain(`${chat}?document=`)
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

  it('opens the list of the documents from the button of the bar', async () => {
    setPathname(chat)
    renderWithProviders(<DocumentsButton />)

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
