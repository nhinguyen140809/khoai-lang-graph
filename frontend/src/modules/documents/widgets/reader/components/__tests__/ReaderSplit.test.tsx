import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { type ChatReference, useReferenceOpener } from '@/modules/activity/entities'
import { routerMock, setPathname, setQuery } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectPushedTo, expectRole, pressButton } from '@/test/steps'

import { DocumentsButton } from '../DocumentsButton'
import { ReaderSplit } from '../ReaderSplit'

const projectId = projectIds.mentor
const chat = `/projects/${projectId}`
const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
const searchItem = itemFixtureByKey(projectId, 'AR-003')

afterEach(() => {
  vi.restoreAllMocks()
})

/** A control of the chat that opens one reference, as a message of the chat does. */
function OpenReference({ reference }: { reference: ChatReference }) {
  const open = useReferenceOpener(reference)
  return (
    <button type="button" onClick={() => open?.()}>
      Open
    </button>
  )
}

/** Renders the chat of the mentor project with its reader, at an address with this query. */
function renderSplit(query: string) {
  setPathname(chat)
  setQuery(query)
  renderWithProviders(
    <ReaderSplit projectId={projectId}>
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
  it('shows the chat alone while the address names no reference', () => {
    renderSplit('')

    expect(screen.getByText('The chat')).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('opens a reference of the chat by naming it in the address', async () => {
    renderSplit('')

    await pressButton('Open')

    await expectPushedTo(`${chat}?document=${analysis.id}`, { scroll: false })
  })

  it('shows the document beside the chat, which stays, with its items opening in the reader', async () => {
    renderSplit(`document=${analysis.id}`)

    const reader = await screen.findByRole('complementary', { name: analysis.title })
    await expectRole('heading', analysis.title, within(reader))
    expect(
      await within(reader).findByRole('link', { name: 'Search with free hours' }),
    ).toHaveAttribute('href', `${chat}?item=${searchItem.id}`)
    expect(screen.getByText('The chat')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the item that the address names, with its kind and its fields', async () => {
    renderSplit(`item=${searchItem.id}`)

    const reader = await screen.findByRole('complementary', { name: 'Search with free hours' })
    await expectRole('heading', 'Search with free hours', within(reader))
    expect(await within(reader).findByText('Analysed requirement')).toBeInTheDocument()
  })

  it('says that a document does not exist', async () => {
    renderSplit('document=missing')

    await expectRole('heading', 'Document not found')
  })

  it('leaves the address of the chat when it closes', async () => {
    renderSplit(`document=${analysis.id}`)
    await screen.findByRole('complementary', { name: analysis.title })

    await pressButton('Close')

    expect(routerMock.replace).toHaveBeenCalledWith(chat, { scroll: false })
  })

  it('lists the documents of the project, each opening in the reader, with the review that waits', async () => {
    renderSplit('reader=documents')

    const reader = await screen.findByRole('complementary', { name: 'Documents' })
    const link = await within(reader).findByRole('link', { name: /Requirements analysis/ })
    expect(link).toHaveAttribute('href', `${chat}?document=${analysis.id}`)
    expect(await within(link).findByText('Waiting for your review')).toBeInTheDocument()
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
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
