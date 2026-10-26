import { HttpResponse } from 'msw'

import { createdId, IdPrefix } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'

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
          status: 422,
          code: 'validation_failed',
          errors: [{ field: 'name', message: 'A project with this name exists.' }],
        },
        { status: 422 },
      ),
    message: 'A project with this name exists.',
  },
  {
    name: 'any other failure, under the form',
    answer: () => new HttpResponse(null, { status: 500 }),
    message: 'Failed to create the project (HTTP 500)',
  },
]

/** A request after the project is created that fails, and the reason that the toast gives. */
export const failedSendCases = [
  {
    request: 'the thread',
    path: apiEndpoints.projectThreads.pattern,
    reason: 'Failed to start a thread (HTTP 500)',
  },
  {
    request: 'the first message',
    path: apiEndpoints.threadMessages.pattern,
    reason: 'Failed to send the idea (HTTP 500)',
  },
]
