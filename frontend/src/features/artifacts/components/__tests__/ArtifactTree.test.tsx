import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockItemByKey } from '@/mocks/artifacts/artifacts.fixtures'
import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ArtifactTree } from '../ArtifactTree'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/')
})

describe('ArtifactTree', () => {
  it('lists the artifacts of the project, each with its version, in the order of the stages', async () => {
    render(<ArtifactTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const list = await screen.findByRole('list', { name: 'Artifacts' })
    const titles = within(list)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.match(/artifacts\/[^/]+$/))
      .map((link) => link.textContent)

    expect(titles[0]).toContain('Elicitation plan')
    expect(titles).toContainEqual(expect.stringContaining('Requirement specification'))
    expect(titles.at(-1)).toContain('Validation report')
  })

  it('opens an artifact with sections into its sections and items, with their outline numbers', async () => {
    render(<ArtifactTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Open Requirement specification' }),
    )

    const search = await screen.findByRole('link', { name: /Search mentors/ })

    expect(search).toHaveTextContent('3.1.1')
    expect(search).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/artifacts/items/${mockItemByKey(PROJECT_IDS.mentor, 'REQ-001').id}`,
    )
    expect(screen.getByRole('link', { name: /Mentor discovery/ })).toHaveTextContent('3.1')
  })

  it('hides what is inside a section when it is closed', async () => {
    render(<ArtifactTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Open Requirement specification' }),
    )
    await screen.findByRole('link', { name: /Search mentors/ })

    await userEvent.click(screen.getByRole('button', { name: 'Close SEC-004' }))

    expect(screen.queryByRole('link', { name: /Search mentors/ })).not.toBeInTheDocument()
  })

  it('groups the items of an artifact without sections by kind', async () => {
    render(<ArtifactTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(await screen.findByRole('button', { name: 'Open Requirements analysis' }))

    expect(await screen.findByText('Raw requirement')).toBeInTheDocument()
    expect(screen.getByText('Conflict')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /RAW-001/ })).toBeInTheDocument()
  })

  it('shows an error with a retry when the artifacts fail to load', async () => {
    window.history.pushState({}, '', '/?mock-artifacts=error')
    render(<ArtifactTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load the artifacts')
    window.history.pushState({}, '', '/')
  })
})
