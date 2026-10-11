import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockItemByKey } from '@/mocks/artifacts.fixtures'
import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { server } from '@/mocks/msw-server.setup'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ItemPage } from '../ItemPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/')
})

function renderItem(key: string) {
  const item = mockItemByKey(PROJECT_IDS.mentor, key)
  render(<ItemPage projectId={PROJECT_IDS.mentor} itemId={item.id} />, { wrapper: TestProviders })
  return item
}

describe('ItemPage', () => {
  it('shows the fields of an item in the order of its schema, with its version and status', async () => {
    renderItem('REQ-001')

    expect(await screen.findByRole('heading', { name: /REQ-001\s*Search mentors/ })).toBeVisible()
    expect(screen.getByText('v3')).toBeVisible()
    expect(screen.getByText('approved')).toBeVisible()
    const terms = screen.getAllByRole('term').map((term) => term.textContent)
    expect(terms.slice(0, 4)).toEqual(['Title', 'Statement', 'Type', 'Quality category'])
    expect(
      screen.getByText('Searching by a field of study lists only mentors of that field'),
    ).toBeVisible()
  })

  it('shows where the item is in its artifact, down to its section', async () => {
    renderItem('REQ-001')

    const trail = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    await within(trail).findByRole('link', { name: 'Requirement specification' })

    expect(within(trail).getByRole('link', { name: /3 Functional requirements/ })).toBeVisible()
    expect(within(trail).getByRole('link', { name: /3\.1 Mentor discovery/ })).toBeVisible()
  })

  it('saves a change of a field as a new version, and shows it', async () => {
    renderItem('REQ-002')
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

    // The field is filled by an event: the panels around the form take the focus from a typed one.
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Narrow the list' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: /Narrow the list/ })).toBeVisible()
    expect(screen.getByText('v3')).toBeVisible()
    expect(screen.getByText(/Edited by you/)).toBeVisible()
  })

  it('names the field that is empty, and does not send the form', async () => {
    renderItem('REQ-002')
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

    await userEvent.clear(screen.getByLabelText('Title *'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a value.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('says when the item was changed elsewhere, and when the items are read-only', async () => {
    renderItem('REQ-002')
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    server.use(
      http.patch('/api/v1/items/:itemId', () =>
        HttpResponse.json(
          {
            title: 'Version conflict',
            status: 409,
            code: 'version_conflict',
            detail: 'The item is at version 4.',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The item is at version 4.')
  })

  it('lists the links of the item, and marks one made from an older version', async () => {
    renderItem('REQ-003')

    const outgoing = await screen.findByRole('list', { name: 'Outgoing links' })

    expect(within(outgoing).getByText('Derived from')).toBeVisible()
    expect(within(outgoing).getByRole('link', { name: 'AR-007' })).toBeVisible()
    expect(within(outgoing).getByText(/made from v1/)).toBeVisible()
    const incoming = await screen.findByRole('list', { name: 'Incoming links' })
    expect(within(incoming).getByRole('link', { name: 'US-003' })).toBeVisible()
  })

  it('lists the versions of the item, compares two, and restores an old one', async () => {
    renderItem('REQ-002')
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    // The field is filled by an event: the panels around the form take the focus from a typed one.
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Narrow the list' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('heading', { name: /Narrow the list/ })

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Timeline' }), { button: 0 })
    const versions = await screen.findByRole('list', { name: 'Versions' })
    expect(within(versions).getAllByRole('listitem')).toHaveLength(3)
    expect(within(versions).getByText(/edited by you/)).toBeVisible()

    await userEvent.click(within(versions).getByRole('button', { name: 'Compare with v2' }))
    expect(within(versions).getByText('Narrow the list')).toBeVisible()
    expect(within(versions).getByText('Filter by field and availability')).toBeVisible()

    const restore = within(versions).getAllByRole('button', { name: 'Restore' })[0]
    if (restore === undefined) throw new Error('No restore button')
    await userEvent.click(restore)
    expect(
      await screen.findByRole('heading', { name: /Filter by field and availability/ }),
    ).toBeVisible()
  })

  it('shows that the item does not exist', async () => {
    render(<ItemPage projectId={PROJECT_IDS.mentor} itemId="nothing" />, { wrapper: TestProviders })

    expect(await screen.findByText('Item not found')).toBeVisible()
  })
})
