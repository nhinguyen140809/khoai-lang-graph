import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { MatrixPage } from '../MatrixPage'
import { MatrixPanel } from '../MatrixPanel'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

describe('Traceability', () => {
  it('renders one row per chain from the backlog to the evidence', async () => {
    render(<MatrixPage projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const backlog = await screen.findByRole('link', { name: 'US-004' })
    expect(backlog).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'REQ-001' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AR-003' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RAW-002' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PER-001#1' })).toBeInTheDocument()
  })

  it('counts the coverage gaps and lists the open issues', async () => {
    render(<MatrixPanel projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const issues = await screen.findByRole('heading', { name: 'Issues' })
    expect(issues).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /AMB-001/ })).toBeInTheDocument()
    const coverage = screen.getByRole('heading', { name: 'Coverage' })
    expect(coverage).toBeInTheDocument()
  })
})
