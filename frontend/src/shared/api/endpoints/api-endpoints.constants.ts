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
  projectArtifacts: apiEndpoint('/projects/:projectId/artifacts'),
  projectItems: apiEndpoint('/projects/:projectId/items'),
  projectExports: apiEndpoint('/projects/:projectId/exports'),

  threads: apiEndpoint('/threads'),
  thread: apiEndpoint('/threads/:threadId'),
  threadMessages: apiEndpoint('/threads/:threadId/messages'),
  threadRuns: apiEndpoint('/threads/:threadId/runs'),

  run: apiEndpoint('/runs/:runId'),
  runSteps: apiEndpoint('/runs/:runId/steps'),
  runCancel: apiEndpoint('/runs/:runId/cancel'),
  runStream: apiEndpoint('/runs/:runId/stream'),

  exportEntry: apiEndpoint('/exports/:exportId'),
  exportEntryFile: apiEndpoint('/exports/:exportId/file'),

  artifact: apiEndpoint('/artifacts/:artifactId'),
  artifactItems: apiEndpoint('/artifacts/:artifactId/items'),
  artifactItemsReorder: apiEndpoint('/artifacts/:artifactId/items/reorder'),
  artifactRevisions: apiEndpoint('/artifacts/:artifactId/revisions'),
  artifactRestore: apiEndpoint('/artifacts/:artifactId/restore'),

  item: apiEndpoint('/items/:itemId'),
  itemMove: apiEndpoint('/items/:itemId/move'),
  itemRevisions: apiEndpoint('/items/:itemId/revisions'),
  itemRestore: apiEndpoint('/items/:itemId/restore'),

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
