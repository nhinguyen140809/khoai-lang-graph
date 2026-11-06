import { encodeId, pathWithQuery } from '@/shared/lib/url'

import { RouteParam } from './route-params'
import { checkedRoute, routeOfAddress } from './typed-route'

/** The pages of one project. Each leaf writes its whole path, so that the route types check it. */
export function projectRoutes(projectId: string) {
  const id = encodeId(projectId)
  return {
    /** The activity of the project, the page a project opens on; with `entryId`, scrolled to that entry. */
    activity: ({ entryId }: { entryId?: string } = {}) =>
      routeOfAddress(
        pathWithQuery(checkedRoute(`/projects/${id}/activity`), {
          [RouteParam.Entry]: entryId,
        }),
      ),
    /** The start page of the documents of the project. */
    documents: () => checkedRoute(`/projects/${id}/documents`),
    /** One document, by the id of its artifact; with `itemId`, scrolled to that item. */
    document: (artifactId: string, { itemId }: { itemId?: string } = {}) =>
      routeOfAddress(
        pathWithQuery(checkedRoute(`/projects/${id}/documents/${encodeId(artifactId)}`), {
          [RouteParam.Item]: itemId,
        }),
      ),
    /** One item, by its id, whatever artifact holds it. */
    item: (itemId: string) => checkedRoute(`/projects/${id}/items/${encodeId(itemId)}`),
  }
}
