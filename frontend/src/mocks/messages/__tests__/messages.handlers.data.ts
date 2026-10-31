import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { threadIds } from '../../shared/db'

/** A body of POST /projects, and the name of the project once its first message is sent. */
export const firstMessageCases = [
  { name: 'a project without a name', project: {}, projectName: 'Thesis tracker' },
  {
    name: 'a project with a name',
    project: { name: 'Clinic booking' },
    projectName: 'Clinic booking',
  },
]

const messagesPath = apiEndpoints.threadMessages.path({ threadId: threadIds.mentorMain })

/** The requests about the messages that the mock server refuses, and the answers. */
export const messageRejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 404 for GET of the messages of a thread that does not exist',
    method: 'GET',
    path: apiEndpoints.threadMessages.path({ threadId: 'no-such-thread' }),
    status: HttpStatus.NotFound,
  },
  {
    name: 'answers 422 for no content',
    method: 'POST',
    path: messagesPath,
    body: '{}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'content', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 422 for a blank content',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "  "}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'content', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 422 for a content that is not text',
    method: 'POST',
    path: messagesPath,
    body: '{"content": 3}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'content', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 422 for a body that is not JSON',
    method: 'POST',
    path: messagesPath,
    body: 'not json',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'content', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 422 for run settings with a field of the wrong type',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "Hi", "run_config": {"max_steps": "five"}}',
    status: HttpStatus.UnprocessableContent,
    answer: {
      errors: [{ field: 'run_config.max_steps', message: 'Send a value of type integer or null.' }],
    },
  },
  {
    name: 'answers 422 for models that is not an object',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "Hi", "models": "sonnet"}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'models', message: 'Send an object.' }] },
  },
  {
    name: 'answers 422 for a model of a role that is not one of the definition',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "Hi", "models": {"chef": "anthropic:claude-sonnet-5"}}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'models.chef', message: 'Choose one of the values.' }] },
  },
  {
    name: 'answers 422 for a model that does not serve its role',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "Hi", "models": {"analyst": "openai:gpt-4.1-mini"}}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'models.analyst', message: 'Choose one of the values.' }] },
  },
  {
    name: 'answers 422 for a role without a model',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "Hi", "models": {"analyst": " "}}',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'models.analyst', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 404 for POST to a thread that does not exist',
    method: 'POST',
    path: apiEndpoints.threadMessages.path({ threadId: 'no-such-thread' }),
    body: '{"content": "Hi"}',
    status: HttpStatus.NotFound,
  },
  {
    name: 'answers 500 in the error scenario of the messages',
    method: 'GET',
    path: messagesPath,
    page: '/?mock-messages=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 500 in the error scenario of sending a message',
    method: 'POST',
    path: messagesPath,
    body: '{"content": "Hi"}',
    page: '/?mock-send-message=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
