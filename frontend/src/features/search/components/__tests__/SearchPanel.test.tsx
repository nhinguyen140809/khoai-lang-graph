import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { itemId, PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { SearchPanel } from '../SearchPanel'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/')
})

describe('SearchPanel', () => {
  it('asks for text before it searches', () => {
    render(<SearchPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(screen.getByText(/Type at least 2 letters/)).toBeInTheDocument()
  })

  it('lists the items that match, each linking to its page', async () => {
    render(<SearchPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search items' }), 'search')

    const result = await screen.findByRole('link', { name: /REQ-001/ })
    expect(result).toHaveTextContent('Search mentors')
    expect(result).toHaveAttribute('href', `/projects/${PROJECT_IDS.mentor}/search/${itemId(6)}`)
    expect(await screen.findByRole('status')).toHaveTextContent('5 results')
  })

  it('says when nothing matches', async () => {
    render(<SearchPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search items' }), 'zzzz')

    expect(await screen.findByText('No items match "zzzz"')).toBeInTheDocument()
  })
})
