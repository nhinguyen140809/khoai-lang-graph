import type { ArtifactFilters } from './artifacts.types'

/** The filters of a list of artifacts as the parameters of its query, with the names of the API. */
export function artifactFilterParams({ kind, reviewStatus }: ArtifactFilters) {
  return { kind, review_status: reviewStatus }
}

/** The filters of a list of items as the parameters of its query, with the names of the API. */
export function itemFilterParams({ kind, reviewStatus }: ArtifactFilters) {
  return { kind, review_status: reviewStatus }
}
