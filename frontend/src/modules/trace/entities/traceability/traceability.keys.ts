import { traceModuleKeys } from '../trace-module.keys'

/** The query keys of the views of the traceability of a project. */
export const traceabilityKeys = {
  all: () => [...traceModuleKeys.all(), 'views'] as const,
  matrix: (projectId: string) => [...traceabilityKeys.all(), 'matrix', projectId] as const,
  coverage: (projectId: string) => [...traceabilityKeys.all(), 'coverage', projectId] as const,
}
