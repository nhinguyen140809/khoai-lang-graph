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
  password: apiEndpoint('/me/password'),
  sessions: apiEndpoint('/me/sessions'),
  session: apiEndpoint('/me/sessions/:sessionId'),
  userSettings: apiEndpoint('/me/settings'),
  models: apiEndpoint('/models'),
  modelSettings: apiEndpoint('/me/model-settings'),
  usage: apiEndpoint('/me/usage'),
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
  runState: apiEndpoint('/runs/:runId/state'),
  runStepState: apiEndpoint('/runs/:runId/steps/:stepId/state'),
  runDirectives: apiEndpoint('/runs/:runId/directives'),
  runInterrupts: apiEndpoint('/runs/:runId/interrupts'),
  runResume: apiEndpoint('/runs/:runId/resume'),
  runRetry: apiEndpoint('/runs/:runId/retry'),
  runCancel: apiEndpoint('/runs/:runId/cancel'),
  runStream: apiEndpoint('/runs/:runId/stream'),

  exportEntry: apiEndpoint('/exports/:exportId'),
  exportEntryFile: apiEndpoint('/exports/:exportId/file'),

  artifact: apiEndpoint('/artifacts/:artifactId'),
  artifactItems: apiEndpoint('/artifacts/:artifactId/items'),
  artifactItemsReorder: apiEndpoint('/artifacts/:artifactId/items/reorder'),
  artifactRevisions: apiEndpoint('/artifacts/:artifactId/revisions'),
  artifactRestore: apiEndpoint('/artifacts/:artifactId/restore'),
  artifactTrace: apiEndpoint('/artifacts/:artifactId/trace'),

  item: apiEndpoint('/items/:itemId'),
  itemMove: apiEndpoint('/items/:itemId/move'),
  itemRevisions: apiEndpoint('/items/:itemId/revisions'),
  itemRestore: apiEndpoint('/items/:itemId/restore'),
  itemTrace: apiEndpoint('/items/:itemId/trace'),

  projectTraceLinks: apiEndpoint('/projects/:projectId/trace-links'),
  traceLink: apiEndpoint('/trace-links/:linkId'),
  traceabilityMatrix: apiEndpoint('/projects/:projectId/traceability/matrix'),
  traceabilityCoverage: apiEndpoint('/projects/:projectId/traceability/coverage'),

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
