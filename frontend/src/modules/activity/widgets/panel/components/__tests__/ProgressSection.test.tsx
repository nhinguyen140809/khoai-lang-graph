import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { ProgressSection } from '../ProgressSection'

const waitingRun = buildRun({
  id: runIds.mentorMain3,
  thread_id: 't1',
  project_id: projectIds.mentor,
  number: 3,
  status: 'interrupted',
  current_stage: 'analysis_review',
})

const runningRun = buildRun({
  id: runIds.libraryMain1,
  thread_id: 't2',
  project_id: projectIds.library,
  number: 1,
  status: 'running',
  current_stage: 'interviewing',
})

describe('ProgressSection', () => {
  it('lists the stages with their marks, done before the current one', async () => {
    renderWithProviders(<ProgressSection run={waitingRun} projectId={projectIds.mentor} />)

    expect(await screen.findByText('Interviewing')).toBeInTheDocument()
    // The status of a step is read after its title, as the sub-steps do.
    expect(screen.getByRole('tab', { name: /Interviewing.*Done/ })).toBeInTheDocument()
    expect(screen.getByText('Planning the interviews')).toBeInTheDocument()
    expect(screen.getByText('Reviewing the analysis')).toBeInTheDocument()
  })

  it('shows the interviews of a stage that runs once for each, one in progress with its number', async () => {
    renderWithProviders(<ProgressSection run={runningRun} projectId={projectIds.library} />)

    // Interviewing opens on its subjects: Mai done, Phong running, Phuc not started.
    const phong = await screen.findByText('Phong')
    // Phong is the interview in progress, and the row carries only its number and name.
    expect(phong.closest('[data-slot="stepper-item"]')).toHaveAttribute('data-state', 'active')
    expect(phong.closest('[data-slot="stepper-item"]')).toHaveAttribute('data-loading', 'true')
    expect(screen.getByText('Mai')).toBeInTheDocument()
    expect(screen.getByText('Phuc')).toBeInTheDocument()
  })

  it('leaves a step reachable by Tab when the run has ended', async () => {
    renderWithProviders(
      <ProgressSection
        run={{ ...runningRun, status: 'succeeded' }}
        projectId={projectIds.library}
      />,
    )

    await screen.findByText('Interviewing')
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('tabindex', '0')
  })

  it('shows the open review mark on a stage that waits for the user', async () => {
    renderWithProviders(<ProgressSection run={waitingRun} projectId={projectIds.mentor} />)

    expect(await screen.findByText('Open review')).toBeInTheDocument()
  })

  it('opens the chat at the latest line of a stage without sub-steps', async () => {
    renderWithProviders(<ProgressSection run={waitingRun} projectId={projectIds.mentor} />)

    // A click on a done step without sub-steps navigates to its work in the chat.
    const step = await screen.findByText('Planning the interviews')
    await userEvent.click(step)
  })

  it('has no accessibility violation', async () => {
    renderWithProviders(<ProgressSection run={waitingRun} projectId={projectIds.mentor} />)

    await screen.findByText('Interviewing')
    await expectNoAccessibilityViolations()
  })
})
