import { http, HttpResponse } from 'msw'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { emptyResponse } from '@/mocks/shared/http/response'
import { buildThread } from '@/mocks/threads/threads.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { ApiErrorCase, SentRequestCase } from '@/test/suites'

import {
  createThread,
  deleteThread,
  getThread,
  listProjectThreads,
  listThreads,
  updateThread,
} from '../threads.api'

/** The answer of POST /projects/{project_id}/threads, as the schema of a thread reads it. */
export const createdThread = buildThread({ id: 't1', project_id: 'p1' })

/** The answer of POST /threads/{thread_id}/messages, as the schema of a sent message reads it. */
export const sentMessage = {
  message: {
    id: 'm1',
    thread_id: 't1',
    sequence: 1,
    run_id: 'r1',
    author: 'user',
    agent_role: null,
    content: 'An idea',
    artifact_refs: [],
    item_refs: [],
    delivery: 'started_run',
    delivered_in_step_id: null,
    created_at: '2026-10-01T09:00:00Z',
  },
  run: buildRun({ id: 'r1', thread_id: 't1', project_id: 'p1', number: 1 }),
}

/** A call of the thread API, and the request it sends. */
export const sentThreadRequestCases = [
  {
    name: 'reads the first page of the threads of a project',
    call: () => listProjectThreads('p 1', null, 20),
    request: {
      method: 'GET',
      path: `${apiEndpoints.projectThreads.path({ projectId: 'p 1' })}?limit=20`,
      body: null,
    },
  },
  {
    name: 'reads the next page of the threads of a project, with the cursor',
    call: () => listProjectThreads('p 1', 'next', 20),
    request: {
      method: 'GET',
      path: `${apiEndpoints.projectThreads.path({ projectId: 'p 1' })}?limit=20&cursor=next`,
      body: null,
    },
  },
  {
    name: 'reads the first page of the threads of the user',
    call: () => listThreads(null, 20),
    request: { method: 'GET', path: `${apiEndpoints.threads.path()}?limit=20`, body: null },
  },
  {
    name: 'reads the threads of the user of one project',
    call: () => listThreads(null, 20, { projectId: 'p1' }),
    request: {
      method: 'GET',
      path: `${apiEndpoints.threads.path()}?project_id=p1&limit=20`,
      body: null,
    },
  },
  {
    name: 'reads a thread by its id, encoded',
    call: () => getThread('t 1'),
    request: { method: 'GET', path: apiEndpoints.thread.path({ threadId: 't 1' }), body: null },
  },
  {
    name: 'creates a thread without a title',
    call: () => createThread('p 1'),
    request: {
      method: 'POST',
      path: apiEndpoints.projectThreads.path({ projectId: 'p 1' }),
      body: {},
    },
  },
  {
    name: 'creates a thread with a title',
    call: () => createThread('p 1', { title: 'Interviews' }),
    request: {
      method: 'POST',
      path: apiEndpoints.projectThreads.path({ projectId: 'p 1' }),
      body: { title: 'Interviews' },
    },
  },
  {
    name: 'renames a thread',
    call: () => updateThread('t 1', { title: 'Renamed' }),
    request: {
      method: 'PATCH',
      path: apiEndpoints.thread.path({ threadId: 't 1' }),
      body: { title: 'Renamed' },
    },
  },
  {
    name: 'archives a thread',
    call: () => updateThread('t 1', { status: 'archived' }),
    request: {
      method: 'PATCH',
      path: apiEndpoints.thread.path({ threadId: 't 1' }),
      body: { status: 'archived' },
    },
  },
  {
    name: 'deletes a thread',
    call: () => deleteThread('t 1'),
    request: { method: 'DELETE', path: apiEndpoints.thread.path({ threadId: 't 1' }), body: null },
  },
] satisfies SentRequestCase[]

/** A refusal of the thread API, and the ApiError that the call throws. */
export const threadApiErrorCases = [
  {
    name: 'the threads of a project are not found',
    refuse: () => http.get(apiEndpoints.projectThreads.pattern, notFoundAnswer),
    call: () => listProjectThreads('p1', null, 20),
    error: {
      status: HttpStatus.NotFound,
      code: null,
      message: 'Failed to load the threads of the project (HTTP 404)',
    },
  },
  {
    name: 'the threads of the user are not found',
    refuse: () => http.get(apiEndpoints.threads.pattern, notFoundAnswer),
    call: () => listThreads(null, 20),
    error: {
      status: HttpStatus.NotFound,
      code: null,
      message: 'Failed to load the threads (HTTP 404)',
    },
  },
  {
    name: 'a thread is not found',
    refuse: () => http.get(apiEndpoints.thread.pattern, notFoundAnswer),
    call: () => getThread('t1'),
    error: {
      status: HttpStatus.NotFound,
      code: null,
      message: 'Failed to load the thread (HTTP 404)',
    },
  },
  {
    name: 'a thread with an unfinished run is not deleted',
    refuse: () => http.delete(apiEndpoints.thread.pattern, conflictAnswer),
    call: () => deleteThread('t1'),
    error: {
      status: HttpStatus.Conflict,
      code: null,
      message: 'Failed to delete the thread (HTTP 409)',
    },
  },
  {
    name: 'a change of a thread is not valid',
    refuse: () =>
      http.patch(apiEndpoints.thread.pattern, () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: HttpStatus.UnprocessableContent,
            code: 'validation_failed',
            errors: [],
          },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    call: () => updateThread('t1', { title: 'Renamed' }),
    error: {
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      message: 'Failed to change the thread (HTTP 422)',
    },
  },
] satisfies ApiErrorCase[]

/** An answer with the status of a record that is not found. */
const notFoundAnswer = () => emptyResponse(HttpStatus.NotFound)

/** An answer with the status of a change that the state of a record refuses. */
const conflictAnswer = () => emptyResponse(HttpStatus.Conflict)
