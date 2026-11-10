import type { ApiClient } from './api-client.utils'
import {
  deleteDocument,
  deleteProject,
  deleteThread,
  listDocuments,
  listProjects,
  listThreads,
  updateProject,
  updateThread,
  uploadDocument,
} from './api-projects.utils'
import {
  answerReview,
  approveEveryReview,
  cancelRun,
  createExport,
  createProject,
  createThread,
  editItem,
  getRun,
  listArtifacts,
  listItems,
  listSteps,
  pendingReview,
  resumeRun,
  retryRun,
  sendMessage,
  setModelDelay,
  startFinishedRun,
  startRun,
  waitForReview,
  waitForRun,
} from './api-runs.utils'

const steps = {
  deleteDocument,
  deleteProject,
  deleteThread,
  listDocuments,
  listProjects,
  listThreads,
  updateProject,
  updateThread,
  uploadDocument,
  answerReview,
  approveEveryReview,
  cancelRun,
  createExport,
  createProject,
  createThread,
  editItem,
  getRun,
  listArtifacts,
  listItems,
  listSteps,
  pendingReview,
  resumeRun,
  retryRun,
  sendMessage,
  setModelDelay,
  startFinishedRun,
  startRun,
  waitForReview,
  waitForRun,
}

type Bound<Step> = Step extends (client: ApiClient, ...args: infer Args) => infer Result
  ? (...args: Args) => Result
  : never

/** The calls and waits of the tests on runs, as the user of the API performs them: each one is called without the client. */
export type ApiSteps = { [Name in keyof typeof steps]: Bound<(typeof steps)[Name]> }

/** Binds each step to the client, so that a test writes `api.startRun(idea)`. */
export function apiOf(client: ApiClient): ApiSteps {
  const bound: Record<string, unknown> = {}
  for (const [name, step] of Object.entries(steps)) {
    bound[name] = (...args: unknown[]) => (step as (...all: unknown[]) => unknown)(client, ...args)
  }
  return bound as ApiSteps
}
