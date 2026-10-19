/** The query keys of the workflow, from the widest to the narrowest; each starts with the one above. */
export const workflowKeys = {
  all: () => ['workflow'] as const,
  /** The stages of a version of the workflow, which the runs go through. */
  stages: (version: number) => [...workflowKeys.all(), 'stages', version] as const,
}
