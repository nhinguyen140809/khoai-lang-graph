import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds } from '@/mocks/shared/db'

import { useRunActivity } from '../../hooks/useRunActivity'
import { RunActivityProvider } from '../RunActivityContext'

const run = buildRun({
  id: runIds.mentorMain3,
  thread_id: 't1',
  project_id: projectIds.mentor,
  number: 3,
})

/** Reads what the provider gives, to see it reach the entry below. */
function Entry() {
  const { run, thread, projectId } = useRunActivity()
  return (
    <p>
      {run.id} {thread === null ? 'no thread' : thread.id} {projectId}
    </p>
  )
}

describe('RunActivityContext', () => {
  it('gives the run of the provider to the entries under it', () => {
    render(
      <RunActivityProvider value={{ run, thread: null, projectId: projectIds.mentor }}>
        <Entry />
      </RunActivityProvider>,
    )

    expect(screen.getByText(`${run.id} no thread ${projectIds.mentor}`)).toBeInTheDocument()
  })

  it('refuses to read a run outside a provider', () => {
    // The message names the mistake, so it says where the provider belongs.
    expect(() => render(<Entry />)).toThrow(/inside its provider/)
  })
})
