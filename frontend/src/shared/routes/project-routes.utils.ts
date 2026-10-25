import { checkedRoute } from './typed-route/typed-route.utils'

/** The pages of one project. Each leaf writes its whole path, so that the route types check it. */
export function projectRoutes(projectId: string) {
  const id = encodeURIComponent(projectId)
  return {
    /** The activity of the project, the page a project opens on. */
    activity: () => checkedRoute(`/projects/${id}/activity`),
  }
}
