import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { ArtifactsPanel } from '../ArtifactsPanel'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

describe('ArtifactsPanel', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/projects/p1/artifacts')
  })

  it('lists the artifacts of the project as tree roots', async () => {
    render(<ArtifactsPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const node = await screen.findByRole('link', { name: 'Requirement specification' })
    expect(node).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/artifacts/a2b30000-0000-4000-8000-000000000005`,
    )
  })

  it('hangs the items under their artifact', async () => {
    render(<ArtifactsPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const item = await screen.findByRole('link', { name: 'US-004' })
    expect(item).toHaveAttribute(
      'href',
      expect.stringContaining(
        `/projects/${PROJECT_IDS.mentor}/artifacts/a2b30000-0000-4000-8000-000000000006/`,
      ),
    )
  })
})
