import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { buildRun, buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { workEntries } from '@/modules/run/entities'
import { renderWithProviders } from '@/test/render'
import { expectText, pressRole } from '@/test/steps'

import { activityChatMessages } from '../../activity-chat.constants'
import { FailureEntryView } from '../FailureEntryView'
import { PhaseEntryView } from '../PhaseEntryView'
import { RunActivityProvider } from '../RunActivityContext'

const run = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 1,
})

function phaseOf(fields: Parameters<typeof buildStep>[0]) {
  const [phase] = workEntries([buildStep(fields)], { status: 'succeeded' })
  if (phase === undefined) throw new Error('The step makes a phase')
  return phase
}

function inRun(children: React.ReactNode) {
  return renderWithProviders(
    <RunActivityProvider value={{ run, thread: null, projectId: projectIds.mentor }}>
      {children}
    </RunActivityProvider>,
  )
}

describe('PhaseEntryView', () => {
  const work = phaseOf({ sequence: 1, agent_role: 'planner', stage: 'planning' })

  it('shows the title of the phase and whether its items show', () => {
    inRun(
      <PhaseEntryView
        work={work}
        stageTitle="Planning the interviews"
        subjectTitle={null}
        isOpen
        onToggle={() => undefined}
      />,
    )

    const toggle = screen.getByRole('button', { name: activityChatMessages.showDetails })
    expect(toggle).toHaveTextContent('Planning the interviews')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('adds the subject to the title', () => {
    inRun(
      <PhaseEntryView
        work={work}
        stageTitle="Interviews"
        subjectTitle="Student"
        isOpen={false}
        onToggle={() => undefined}
      />,
    )

    const toggle = screen.getByRole('button', { name: activityChatMessages.showDetails })
    expect(toggle).toHaveTextContent('Interviews: Student')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('asks to open or close the items when it is pressed', async () => {
    const onToggle = vi.fn()
    inRun(
      <PhaseEntryView
        work={work}
        stageTitle="Planning"
        subjectTitle={null}
        isOpen={false}
        onToggle={onToggle}
      />,
    )

    await pressRole('button', activityChatMessages.showDetails)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})

describe('FailureEntryView', () => {
  it('says how the phase failed', async () => {
    const failed = phaseOf({
      sequence: 1,
      agent_role: 'planner',
      stage: 'planning',
      status: 'failed',
      error: 'The model did not answer.',
    })
    inRun(<FailureEntryView work={failed} />)

    await expectText(/did not answer|stopped because of an error/i)
  })
})
