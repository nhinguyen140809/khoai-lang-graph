import { apiEndpoints } from '@/shared/api/endpoints'
import { fetchPage, type ListPage } from '@/shared/api/request'

import { type Revision, revisionSchema } from './revisions.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the versions of an artifact, newest first. */
export function listArtifactRevisions(
  artifactId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Revision>> {
  return fetchPage(apiEndpoints.artifactRevisions.path({ artifactId }), revisionSchema, {
    limit,
    cursor,
    action: 'load the versions of the artifact',
  })
}

/** One page of the versions of an item, newest first. */
export function listItemRevisions(
  itemId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Revision>> {
  return fetchPage(apiEndpoints.itemRevisions.path({ itemId }), revisionSchema, {
    limit,
    cursor,
    action: 'load the versions of the item',
  })
}
