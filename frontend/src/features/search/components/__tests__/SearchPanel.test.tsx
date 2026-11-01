import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockArtifactItems } from '@/mocks/artifacts/artifacts.fixtures'
import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
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
    const requirement = mockArtifactItems.find(
      ({ key, project_id }) => key === 'REQ-001' && project_id === PROJECT_IDS.mentor,
    )
    expect(result).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/artifacts/items/${requirement?.id ?? ''}`,
    )
    const matching = mockArtifactItems.filter(
      ({ project_id, key, content }) =>
        project_id === PROJECT_IDS.mentor &&
        (key.toLowerCase().includes('search') ||
          JSON.stringify(content).toLowerCase().includes('search')),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      `${String(matching.length)} results`,
    )
  })

  it('says when nothing matches', async () => {
    render(<SearchPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search items' }), 'zzzz')

    expect(await screen.findByText('No items match "zzzz"')).toBeInTheDocument()
  })
})
