import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockItemByKey } from '@/mocks/artifacts.fixtures'
import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { setPathname, setSearch } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { TraceabilityNav } from '../TraceabilityNav'
import { TraceabilityPage } from '../TraceabilityPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  window.history.pushState({}, '', '/')
  setPathname('/')
  setSearch('')
})

describe('TraceabilityPage', () => {
  it('shows one row for each chain, with the columns that the server names, and links to the items', async () => {
    render(<TraceabilityPage projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const table = await screen.findByRole('table', { name: 'Traceability matrix' })

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Backlog', 'Spec', 'Analyzed', 'Source', 'Evidence'])
    const row = within(table).getByRole('link', { name: 'US-002' }).closest('tr')
    expect(row).toHaveTextContent('REQ-002')
    expect(row).toHaveTextContent('RAW-002')
    expect(row).toHaveTextContent('LN-001')
    expect(within(table).getByRole('link', { name: 'REQ-002' })).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/artifacts/items/${mockItemByKey(PROJECT_IDS.mentor, 'REQ-002').id}`,
    )
  })

  it('shows only the rows of a gap that is chosen', async () => {
    setSearch('gap=no_source')
    render(<TraceabilityPage projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const table = await screen.findByRole('table', { name: 'Traceability matrix' })

    expect(await within(table).findByRole('link', { name: 'REQ-009' })).toBeInTheDocument()
    expect(within(table).queryByRole('link', { name: 'REQ-002' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Show all rows' })).toBeInTheDocument()
  })

  it('lists the open issues with the items that they are about', async () => {
    setSearch('view=issues')
    render(<TraceabilityPage projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const group = await screen.findByRole('region', { name: 'Conflicts' })

    expect(group).toHaveTextContent('CONF-001')
    expect(within(group).getByRole('link', { name: 'AR-007' })).toBeInTheDocument()
    expect(screen.queryByText('AMB-003')).not.toBeInTheDocument()
  })

  it('says that there is nothing to trace', async () => {
    window.history.pushState({}, '', '/?mock-traceability=empty')
    render(<TraceabilityPage projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(await screen.findByText('Nothing to trace yet')).toBeInTheDocument()
  })
})

describe('TraceabilityNav', () => {
  it('counts the items of each gap and links to its rows', async () => {
    render(<TraceabilityNav projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const link = await screen.findByRole('link', { name: /No backlog item/ })

    expect(link).toHaveTextContent('4')
    expect(link).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/traceability?gap=no_backlog_item`,
    )
    expect(screen.getByRole('link', { name: 'Issues' })).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/traceability?view=issues`,
    )
  })
})
