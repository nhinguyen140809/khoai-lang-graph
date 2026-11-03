import { encodeId } from '@/shared/lib/url'

import { checkedRoute } from './typed-route'

/** The pages of one project. Each leaf writes its whole path, so that the route types check it. */
export function projectRoutes(projectId: string) {
  const id = encodeId(projectId)
  return {
    /** The activity of the project, the page a project opens on. */
    activity: () => checkedRoute(`/projects/${id}/activity`),
    /** The start page of the documents of the project. */
    documents: () => checkedRoute(`/projects/${id}/documents`),
    /** One document, by the id of its artifact. */
    document: (artifactId: string) =>
      checkedRoute(`/projects/${id}/documents/${encodeId(artifactId)}`),
    /** One item, by its id, whatever artifact holds it. */
    item: (itemId: string) => checkedRoute(`/projects/${id}/items/${encodeId(itemId)}`),
  }
}
