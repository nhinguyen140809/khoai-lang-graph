import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { RunsPanel } from '../RunsPanel'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

describe('RunsPanel', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/projects/p1/workflow')
  })

  it('lists the runs of the conversation, newest first', async () => {
    render(<RunsPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const waiting = await screen.findByRole('link', { name: /Run 3: waiting for review/ })
    expect(waiting).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/workflow/5f2d0000-0000-4000-8000-000000000001`,
    )
    expect(screen.getByRole('link', { name: /Run 2: failed/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Run 1: done/ })).toBeInTheDocument()
  })
})
