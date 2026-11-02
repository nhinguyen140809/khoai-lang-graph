import type { ArtifactFilters } from './artifacts.types'

/** The query keys of the artifacts, from the widest to the narrowest; each starts with the one above. */
export const artifactKeys = {
  all: () => ['artifacts'] as const,
  /** The start of the key of every list of artifacts, to load them all again after a change. */
  lists: () => [...artifactKeys.all(), 'list'] as const,
  /** The artifacts of one project, narrowed by the filters. */
  list: (projectId: string, filters: ArtifactFilters) =>
    [...artifactKeys.lists(), projectId, filters] as const,
  /** One artifact as it is now, or as it was at a version. */
  detail: (artifactId: string, version?: number) =>
    [...artifactKeys.all(), 'detail', artifactId, version ?? null] as const,
  /** The versions of one artifact. */
  revisions: (artifactId: string) => [...artifactKeys.all(), 'revisions', artifactId] as const,
}
