/**
 * The query keys of the artifact kinds, from the widest to the narrowest; each starts with the one
 * above.
 */
export const artifactKindKeys = {
  all: () => ['artifact-kinds'] as const,
  /** The kinds of one workflow version, or of the current one without a version, with their content schemas. */
  list: (workflowVersion?: number) =>
    [...artifactKindKeys.all(), 'list', workflowVersion ?? null] as const,
  /** The content schema of one kind at one version. */
  schema: (kind: string, version: number) =>
    [...artifactKindKeys.all(), 'schema', kind, version] as const,
}
