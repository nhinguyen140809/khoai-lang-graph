import type { ArtifactItemFilters, ProjectItemFilters } from './items.types'

/** The query keys of the items, from the widest to the narrowest; each starts with the one above. */
export const itemKeys = {
  all: () => ['items'] as const,
  /** The start of the key of every list of items, to load them all again after a change. */
  lists: () => [...itemKeys.all(), 'list'] as const,
  /** The items of one artifact, in outline order, narrowed by the filters. */
  ofArtifact: (artifactId: string, filters: ArtifactItemFilters) =>
    [...itemKeys.lists(), 'artifact', artifactId, filters] as const,
  /** The items of one project, narrowed by the filters. */
  ofProject: (projectId: string, filters: ProjectItemFilters) =>
    [...itemKeys.lists(), 'project', projectId, filters] as const,
  /** The first page of the items of one project, narrowed by the filters, apart from the pages the list loads. */
  firstOfProject: (projectId: string, filters: ProjectItemFilters) =>
    [...itemKeys.lists(), 'project-first', projectId, filters] as const,
  /**
   * The first page of the items of one artifact, in outline order, apart from the pages the list
   * loads: another shape of data than `ofArtifact` holds.
   */
  firstOfArtifact: (artifactId: string) =>
    [...itemKeys.lists(), 'artifact-first', artifactId] as const,
  /** One item as it is now, or as it was at a version. */
  detail: (itemId: string, version?: number) =>
    [...itemKeys.all(), 'detail', itemId, version ?? null] as const,
  /** The versions of one item. */
  revisions: (itemId: string) => [...itemKeys.all(), 'revisions', itemId] as const,
}
