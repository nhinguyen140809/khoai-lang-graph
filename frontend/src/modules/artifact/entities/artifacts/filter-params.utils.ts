import type { ArtifactFilters } from './artifacts.types'

/**
 * The filters of a list of artifacts or of items as the parameters of its query, with the names of
 * the API. Both lists narrow by the same two fields.
 */
export function filterParams({ kind, reviewStatus }: ArtifactFilters) {
  return { kind, review_status: reviewStatus }
}
