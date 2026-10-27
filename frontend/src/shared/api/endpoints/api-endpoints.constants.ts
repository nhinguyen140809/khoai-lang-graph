import { apiEndpoint } from './api-endpoint.utils'

/**
 * The endpoints of the API. The API functions send their requests to `path`, and the handlers of
 * the mock server and the tests match them with `pattern` or `path`, so that a path is written
 * once.
 */
export const apiEndpoints = {
  login: apiEndpoint('/auth/login'),
  register: apiEndpoint('/auth/register'),
  logout: apiEndpoint('/auth/logout'),
  me: apiEndpoint('/me'),
  health: apiEndpoint('/health'),

  projects: apiEndpoint('/projects'),
  project: apiEndpoint('/projects/:projectId'),
  projectThreads: apiEndpoint('/projects/:projectId/threads'),

  threads: apiEndpoint('/threads'),
  thread: apiEndpoint('/threads/:threadId'),
  threadMessages: apiEndpoint('/threads/:threadId/messages'),
  threadRuns: apiEndpoint('/threads/:threadId/runs'),

  run: apiEndpoint('/runs/:runId'),
  runSteps: apiEndpoint('/runs/:runId/steps'),
  runCancel: apiEndpoint('/runs/:runId/cancel'),
  runStream: apiEndpoint('/runs/:runId/stream'),

  workflowDefinition: apiEndpoint('/workflow/definition'),
  artifactKinds: apiEndpoint('/artifact-kinds'),
  contentSchema: apiEndpoint('/content-schemas/:kind/:version'),
}

/** The paths that answer without a session; every other path of the API needs a logged-in user. */
export const publicApiPaths = [
  apiEndpoints.register.path(),
  apiEndpoints.login.path(),
  apiEndpoints.health.path(),
]
