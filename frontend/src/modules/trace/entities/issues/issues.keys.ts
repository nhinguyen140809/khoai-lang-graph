import { traceModuleKeys } from '../trace-module.keys'

/** The query keys of the open issues of a project. */
export const issueKeys = {
  all: () => [...traceModuleKeys.all(), 'issues'] as const,
  /** The open issues of one project. */
  ofProject: (projectId: string) => [...issueKeys.all(), projectId] as const,
}
