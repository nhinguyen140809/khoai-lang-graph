import type { ArtifactFilters } from '../types/artifacts.types'
import type { ItemFilters } from '../types/items.types'

/** The filters of a list of artifacts as the parameters of its query, with the names of the API. */
export function artifactFilterParams({ kind, reviewStatus }: ArtifactFilters) {
  return { kind, review_status: reviewStatus }
}

/** The filters of a list of items as the parameters of its query, with the names of the API. */
export function itemFilterParams({ kind, reviewStatus }: ItemFilters) {
  return { kind, review_status: reviewStatus }
}
