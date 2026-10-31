import { HttpResponse } from 'msw'

import { createdId, IdPrefix } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { serverError } from '@/test/msw'

const projectId = createdId(IdPrefix.Project, 1)
const threadId = createdId(IdPrefix.Thread, 1)

/** An idea that the form refuses before sending. */
export const blankIdeas = ['', '   ']

/**
 * What the user enters, and the requests that the form sends: the project, its thread, then the
 * idea as the first message. A name or an idea of null is left as the form starts.
 */
export const createCases = [
  {
    name: 'creates the project with the name given and sends the idea',
    projectName: '  Thesis tracker ',
    idea: null,
    language: 'English',
    sent: [
      [apiEndpoints.projects.path(), { name: 'Thesis tracker', output_language: 'en' }],
      [apiEndpoints.projectThreads.path({ projectId }), {}],
      [
        apiEndpoints.threadMessages.path({ threadId }),
        { content: 'Mentor platform for students.' },
      ],
    ],
  },
  {
    name: 'leaves the name to the agents and sends the idea as edited',
    projectName: null,
    idea: ' Find a mentor.\nFor university students. ',
    language: 'Vietnamese',
    sent: [
      [apiEndpoints.projects.path(), { name: null, output_language: 'vi' }],
      [apiEndpoints.projectThreads.path({ projectId }), {}],
      [
        apiEndpoints.threadMessages.path({ threadId }),
        { content: 'Find a mentor.\nFor university students.' },
      ],
    ],
  },
]

/** An answer of POST /projects that fails, and the message the form shows. */
export const failedCreateCases = [
  {
    name: 'a problem of a field, at its field',
    answer: () =>
      HttpResponse.json(
        {
          status: HttpStatus.UnprocessableContent,
          code: 'validation_failed',
          errors: [{ field: 'name', message: 'A project with this name exists.' }],
        },
        { status: HttpStatus.UnprocessableContent },
      ),
    message: 'A project with this name exists.',
  },
  {
    name: 'any other failure, under the form',
    answer: () => serverError(),
    message: 'Failed to create the project (HTTP 500)',
  },
]

/** A request after the project is created that fails, and the reason that the toast gives. */
export const failedSendCases = [
  {
    request: 'the thread',
    path: apiEndpoints.projectThreads.pattern,
    reason: 'Failed to create the thread (HTTP 500)',
  },
  {
    request: 'the first message',
    path: apiEndpoints.threadMessages.pattern,
    reason: 'Failed to send the message (HTTP 500)',
  },
]
