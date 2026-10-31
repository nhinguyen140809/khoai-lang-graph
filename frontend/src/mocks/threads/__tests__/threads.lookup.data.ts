import { generatedProjects } from '../../generated/fixtures/generated-projects.fixtures'
import { runIds } from '../../shared/db'

/** The mentor thread, in a state of its run: the run fields that the lookup derives for it. */
export const mentorRunStateCases = [
  {
    name: 'waits for review',
    address: '/',
    thread: {
      current_stage: 'analysis_review',
      active_run_id: runIds.mentorMain3,
      latest_run_status: 'interrupted',
    },
  },
  {
    name: 'is running',
    address: '/?mock-run-status=running',
    thread: {
      current_stage: 'analysis',
      active_run_id: runIds.mentorMain3,
      latest_run_status: 'running',
    },
  },
  {
    name: 'failed',
    address: '/?mock-run-status=failed',
    thread: { current_stage: 'analysis', active_run_id: null, latest_run_status: 'failed' },
  },
  {
    name: 'is done',
    address: '/?mock-run-status=done',
    thread: { current_stage: 'done', active_run_id: null, latest_run_status: 'succeeded' },
  },
]

/** Each generated project, by name: the run fields of its thread come from its run. */
export const generatedThreadCases = generatedProjects().map(({ id, name }) => ({
  name,
  projectId: id,
}))
