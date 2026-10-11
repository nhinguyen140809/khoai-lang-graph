/** The query keys of the artifacts, from the widest to the narrowest. */
export const artifactKeys = {
  kinds: () => ['artifacts', 'kinds'] as const,
  project: (projectId: string) => ['artifacts', 'project', projectId] as const,
  artifact: (artifactId: string) => ['artifacts', 'artifact', artifactId] as const,
  items: (artifactId: string) => ['artifacts', 'items', artifactId] as const,
  item: (itemId: string) => ['artifacts', 'item', itemId] as const,
  revisions: (itemId: string) => ['artifacts', 'revisions', itemId] as const,
  trace: (itemId: string) => ['artifacts', 'trace', itemId] as const,
  schema: (kind: string, version: number) => ['artifacts', 'schema', kind, version] as const,
  definition: () => ['artifacts', 'definition'] as const,
  export: (exportId: string) => ['artifacts', 'export', exportId] as const,
}
