import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { projectIds, runIds, threadIds } from '../../shared/db'

/** A request for a list of threads in the scenario of the page address: the ids it lists. */
export const threadListCases = [
  {
    request: 'GET /threads?project_id={project_id}',
    address: '/',
    path: `${apiEndpoints.threads.path()}?project_id=${projectIds.library}`,
    ids: [threadIds.libraryMain],
  },
  {
    request: 'GET /projects/{project_id}/threads',
    address: '/',
    path: apiEndpoints.projectThreads.path({ projectId: projectIds.mentor }),
    ids: [threadIds.mentorMain],
  },
  {
    request: 'GET /threads in the empty scenario',
    address: '/?mock-threads=empty',
    path: apiEndpoints.threads.path(),
    ids: [],
  },
  {
    request: 'GET /projects/{project_id}/threads in the empty scenario',
    address: '/?mock-threads=empty',
    path: apiEndpoints.projectThreads.path({ projectId: projectIds.mentor }),
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
      latest_run_status: 'interrupted',
      current_stage: 'analysis_review',
    },
  },
  {
    name: 'is running',
    address: '/?mock-run-status=running',
    thread: { active_run_id: runIds.mentorMain3, latest_run_status: 'running' },
  },
  {
    name: 'failed',
    address: '/?mock-run-status=failed',
    thread: { active_run_id: null, latest_run_status: 'failed' },
  },
  {
    name: 'is done',
    address: '/?mock-run-status=done',
    thread: { active_run_id: null, latest_run_status: 'succeeded' },
  },
]

/** A request in the scenario of the page address, and the error it answers. */
export const threadErrorCases = [
  {
    request: 'GET /threads in the error scenario',
    address: '/?mock-threads=error',
    path: apiEndpoints.threads.path(),
    status: HttpStatus.InternalServerError,
    code: 'internal_error',
  },
  {
    request: 'GET /projects/{project_id}/threads of a project that does not exist',
    address: '/',
    path: apiEndpoints.projectThreads.path({ projectId: 'no-such-project' }),
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} of a thread that does not exist',
    address: '/',
    path: apiEndpoints.thread.path({ threadId: 'no-such-thread' }),
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} in the empty scenario',
    address: '/?mock-thread=empty',
    path: apiEndpoints.thread.path({ threadId: threadIds.mentorMain }),
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'GET /threads/{thread_id} in the error scenario',
    address: '/?mock-thread=error',
    path: apiEndpoints.thread.path({ threadId: threadIds.mentorMain }),
    status: HttpStatus.InternalServerError,
    code: 'internal_error',
  },
]

/** The requests that change a thread that the mock server refuses, and the answers. */
export const threadRejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 404 for PATCH of a thread that does not exist',
    method: 'PATCH',
    path: apiEndpoints.thread.path({ threadId: 'no-such-thread' }),
    body: '{"title": "New"}',
    status: HttpStatus.NotFound,
  },
  {
    name: 'answers 404 for DELETE of a thread that does not exist',
    method: 'DELETE',
    path: apiEndpoints.thread.path({ threadId: 'no-such-thread' }),
    status: HttpStatus.NotFound,
  },
  {
    name: 'answers 409 for DELETE of the mentor thread while its run waits',
    method: 'DELETE',
    path: apiEndpoints.thread.path({ threadId: threadIds.mentorMain }),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'answers 422 for a blank title of a new thread',
    method: 'POST',
    path: apiEndpoints.projectThreads.path({ projectId: projectIds.mentor }),
    body: '{"title": "  "}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'title', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 422 for a null title on PATCH',
    method: 'PATCH',
    path: apiEndpoints.thread.path({ threadId: threadIds.campusMain }),
    body: '{"title": null}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'title', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 422 for an unknown status',
    method: 'PATCH',
    path: apiEndpoints.thread.path({ threadId: threadIds.campusMain }),
    body: '{"status": "closed"}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'status', message: 'Choose one of the values.' }] },
  },
  {
    name: 'answers 500 in the error scenario of creating a thread',
    method: 'POST',
    path: apiEndpoints.projectThreads.path({ projectId: projectIds.mentor }),
    body: '{}',
    page: '/?mock-create-thread=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 500 in the error scenario of updating a thread',
    method: 'PATCH',
    path: apiEndpoints.thread.path({ threadId: threadIds.campusMain }),
    body: '{"title": "New"}',
    page: '/?mock-update-thread=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 500 in the error scenario of deleting a thread',
    method: 'DELETE',
    path: apiEndpoints.thread.path({ threadId: threadIds.laundryMain }),
    page: '/?mock-delete-thread=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
