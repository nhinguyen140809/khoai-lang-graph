import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockRunSteps } from '@/mocks/runs/runs.fixtures'
import { PROJECT_IDS, RUN_IDS } from '@/mocks/shared/mock-ids.constants'
import { setPathname, setSearch } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { RunPage } from '../RunPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  window.history.pushState({}, '', '/')
  setPathname('/')
  setSearch('')
})

describe('RunPage', () => {
  it('draws the graph of the workflow of the run, with the state of its nodes', async () => {
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain1} />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByText(/Run 1: done/)).toBeInTheDocument()
    expect(await screen.findAllByLabelText(/, done/, {}, { timeout: 5000 })).not.toHaveLength(0)
    expect(screen.getByLabelText(/^START/)).toBeInTheDocument()
  })

  it('says that a run does not exist', async () => {
    render(<RunPage projectId={PROJECT_IDS.mentor} runId="missing" />, { wrapper: TestProviders })

    expect(await screen.findByText('Run not found')).toBeInTheDocument()
  })

  it('asks to choose a node or a step when none is chosen', async () => {
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain1} />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByText(/Choose a node of the graph/)).toBeInTheDocument()
  })

  it('shows the chosen step with what it made, and offers a retry from it when no run goes on', async () => {
    window.history.pushState({}, '', '/?mock-run-state=done')
    const step = mockRunSteps(RUN_IDS.mentorMain1, 'waiting').find(
      ({ produced }) => produced.length > 0,
    )
    setSearch(`step=${step?.id ?? ''}`)
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain1} />, {
      wrapper: TestProviders,
    })

    const panel = await screen.findByRole('region', { name: 'Chosen step' })

    expect(panel).toHaveTextContent(`STEP ${String(step?.sequence)}`)
    expect(within(panel).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/artifacts/items/'),
    )
    expect(screen.getByRole('button', { name: 'Retry from this step' })).toBeEnabled()
  })

  it('does not offer a retry from a finished run while another run of the project goes on', async () => {
    const step = mockRunSteps(RUN_IDS.mentorMain1, 'waiting')[0]
    setSearch(`step=${step?.id ?? ''}`)
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain1} />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByRole('button', { name: 'Retry from this step' })).toBeDisabled()
  })

  it('disables the retry and offers the review while the run waits at a checkpoint', async () => {
    const step = mockRunSteps(RUN_IDS.mentorMain3, 'waiting').at(-1)
    setSearch(`step=${step?.id ?? ''}`)
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain3} />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByRole('link', { name: 'Open review' })).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/review/${RUN_IDS.mentorMain3}`,
    )
    expect(screen.getByRole('button', { name: 'Retry from this step' })).toBeDisabled()
  })

  it('shows the state of the workflow after the chosen step, with links to what it refers to', async () => {
    const step = mockRunSteps(RUN_IDS.mentorMain1, 'waiting').at(-1)
    setSearch(`step=${step?.id ?? ''}`)
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain1} />, {
      wrapper: TestProviders,
    })
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'State' }))

    const state = await screen.findByRole('region', { name: 'Workflow state' })

    expect(await within(state).findByText('current_stage')).toBeInTheDocument()
    expect(await within(state).findByRole('link', { name: /^REQ-001/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/artifacts/items/'),
    )
  })

  it('says that a node of the graph was not reached, when the address chooses it', async () => {
    setSearch('node=validator')
    render(<RunPage projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain3} />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByText(/was not reached in this run/)).toBeInTheDocument()
  })
})
