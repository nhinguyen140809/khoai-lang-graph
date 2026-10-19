import { PROJECT_IDS, RUN_IDS, THREAD_IDS } from '../../shared/mock-ids.constants'

/** A request for a list of threads in the scenario of the page address: the ids it lists. */
export const threadListCases = [
  {
    request: 'GET /threads?project_id={project_id}',
    address: '/',
    path: `/api/v1/threads?project_id=${PROJECT_IDS.library}`,
    ids: [THREAD_IDS.libraryMain],
  },
  {
    request: 'GET /projects/{project_id}/threads',
    address: '/',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}/threads`,
    ids: [THREAD_IDS.mentorMain, THREAD_IDS.mentorPricing],
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
    path: `/api/v1/projects/${PROJECT_IDS.mentor}/threads`,
    ids: [],
  },
]

/** The thread of the API examples, in a state of its run: the fields it answers. */
export const threadRunStateCases = [
  {
    name: 'waits for review',
    address: '/',
    thread: {
      project_id: PROJECT_IDS.mentor,
      active_run_id: RUN_IDS.mentorMain3,
      latest_run_status: 'interrupted',
      current_stage: 'analysis_review',
    },
  },
  {
    name: 'is about to start',
    address: '/?mock-run-state=queued',
    thread: { active_run_id: RUN_IDS.mentorMain3, latest_run_status: 'queued' },
  },
  {
    name: 'is running',
    address: '/?mock-run-state=running',
    thread: { active_run_id: RUN_IDS.mentorMain3, latest_run_status: 'running' },
  },
  {
    name: 'failed',
    address: '/?mock-run-state=failed',
    thread: { active_run_id: null, latest_run_status: 'failed' },
  },
  {
    name: 'is done',
    address: '/?mock-run-state=done',
    thread: { active_run_id: null, latest_run_status: 'succeeded' },
  },
]

/** A request, with its method, in the scenario of the page address, and the error it answers. */
export const threadErrorCases = [
  {
    request: 'GET /threads in the error scenario',
    method: 'GET',
    address: '/?mock-threads=error',
    path: '/api/v1/threads',
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'GET /projects/{project_id}/threads of a project that does not exist',
    method: 'GET',
    address: '/',
    path: '/api/v1/projects/no-such-project/threads',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} of a thread that does not exist',
    method: 'GET',
    address: '/',
    path: '/api/v1/threads/no-such-thread',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} in the empty scenario',
    method: 'GET',
    address: '/?mock-thread=empty',
    path: `/api/v1/threads/${THREAD_IDS.mentorMain}`,
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} in the error scenario',
    method: 'GET',
    address: '/?mock-thread=error',
    path: `/api/v1/threads/${THREAD_IDS.mentorMain}`,
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'POST /projects/{project_id}/threads of a project that does not exist',
    method: 'POST',
    address: '/',
    path: '/api/v1/projects/no-such-project/threads',
    status: 404,
    code: 'not_found',
  },
]

/** A body of POST /projects/{project_id}/threads, and the title of the thread it creates. */
export const createThreadCases = [
  { name: 'no body field', body: {}, title: null },
  { name: 'a title', body: { title: ' Interviews ' }, title: 'Interviews' },
  { name: 'a blank title', body: { title: '  ' }, title: null },
]
