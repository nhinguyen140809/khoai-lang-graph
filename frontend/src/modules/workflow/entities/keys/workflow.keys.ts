/**
 * The query keys of the workflow, from the widest to the narrowest; each starts with the one above.
 */
export const workflowKeys = {
  all: () => ['workflow'] as const,
  /** The definition at one version, or the current one without a version. */
  definition: (version?: number) => [...workflowKeys.all(), 'definition', version ?? null] as const,
}
