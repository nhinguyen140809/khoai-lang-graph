import { projectIds, runIds, threadIds } from '../../shared/db/mock-ids.constants'

/** A request for a list of threads in the scenario of the page address: the ids it lists. */
export const threadListCases = [
  {
    request: 'GET /threads?project_id={project_id}',
    address: '/',
    path: `/api/v1/threads?project_id=${projectIds.library}`,
    ids: [threadIds.libraryMain],
  },
  {
    request: 'GET /projects/{project_id}/threads',
    address: '/',
    path: `/api/v1/projects/${projectIds.mentor}/threads`,
    ids: [threadIds.mentorMain],
  },
  {
    request: 'GET /threads in the empty scenario',
    address: '/?mock-threads=empty',
    path: '/api/v1/threads',
    ids: [],
  },
  {
    request: 'GET /projects/{project_id}/threads in the empty scenario',
    address: '/?mock-threads=empty',
    path: `/api/v1/projects/${projectIds.mentor}/threads`,
    ids: [],
  },
]

/** The thread of the API examples, in a state of its run: the fields it answers. */
export const threadRunStateCases = [
  {
    name: 'waits for review',
    address: '/',
    thread: {
      project_id: projectIds.mentor,
      active_run_id: runIds.mentorMain3,
      active_run_status: 'interrupted',
      current_stage: 'analysis_review',
    },
  },
  {
    name: 'is running',
    address: '/?mock-run-state=running',
    thread: { active_run_id: runIds.mentorMain3, active_run_status: 'running' },
  },
  {
    name: 'failed',
    address: '/?mock-run-state=failed',
    thread: { active_run_id: null, active_run_status: null },
  },
  {
    name: 'is done',
    address: '/?mock-run-state=done',
    thread: { active_run_id: null, active_run_status: null },
  },
]

/** A request in the scenario of the page address, and the error it answers. */
export const threadErrorCases = [
  {
    request: 'GET /threads in the error scenario',
    address: '/?mock-threads=error',
    path: '/api/v1/threads',
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'GET /projects/{project_id}/threads of a project that does not exist',
    address: '/',
    path: '/api/v1/projects/no-such-project/threads',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} of a thread that does not exist',
    address: '/',
    path: '/api/v1/threads/no-such-thread',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} in the empty scenario',
    address: '/?mock-thread=empty',
    path: `/api/v1/threads/${threadIds.mentorMain}`,
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} in the error scenario',
    address: '/?mock-thread=error',
    path: `/api/v1/threads/${threadIds.mentorMain}`,
    status: 500,
    code: 'internal_error',
  },
]
