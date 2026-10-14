import { checkedRoute, search } from './route-builder.utils'
import { type ProjectSettingsSection, RouteParam } from './route-params.constants'

/** The pages of one project. Each leaf writes its whole path, so that the route types check it. */
export function projectRoutes(projectId: string) {
  const id = encodeURIComponent(projectId)
  const part = encodeURIComponent
  return {
    /** The console of the project, the page a project opens on. */
    console: () => checkedRoute(`/projects/${id}/console`),
    /** The console that one thread holds. */
    thread: (threadId: string) => checkedRoute(`/projects/${id}/console/${part(threadId)}`),
    /** The address under which the reviews of the runs are; it is no page itself. */
    reviewsPath: () => `/projects/${id}/review`,
    /** The review of a run that waits at a checkpoint. */
    review: (runId: string) => checkedRoute(`/projects/${id}/review/${part(runId)}`),
    /** The artifacts of the project, with the export dialog open when `exporting`. */
    artifacts: ({ exporting = false }: { exporting?: boolean } = {}) =>
      checkedRoute(
        `/projects/${id}/artifacts${search({ [RouteParam.Export]: exporting ? '' : undefined })}`,
      ),
    /** An artifact, shown as a document. */
    artifact: (artifactId: string) => checkedRoute(`/projects/${id}/artifacts/${part(artifactId)}`),
    /** One item of an artifact. */
    item: (itemId: string) => checkedRoute(`/projects/${id}/artifacts/items/${part(itemId)}`),
    /** The search of the items of the project. */
    search: () => checkedRoute(`/projects/${id}/search`),
    /** The runs of the project. */
    workflow: () => checkedRoute(`/projects/${id}/workflow`),
    /** A run, and one of its steps when `stepId` is given. */
    run: (runId: string, stepId?: string) =>
      checkedRoute(
        `/projects/${id}/workflow/${part(runId)}${search({ [RouteParam.Step]: stepId })}`,
      ),
    /** A run with a node of its graph chosen, for a node that has no step. */
    runNode: (runId: string, nodeId: string) =>
      checkedRoute(
        `/projects/${id}/workflow/${part(runId)}${search({ [RouteParam.Node]: nodeId })}`,
      ),
    /** The traceability of the project, with the view and the gap chosen. */
    traceability: ({ view, gap }: { view?: 'issues'; gap?: string } = {}) =>
      checkedRoute(
        `/projects/${id}/traceability${search({ [RouteParam.View]: view, [RouteParam.Gap]: gap })}`,
      ),
    /** A section of the settings of the project. */
    settings: (section: ProjectSettingsSection = 'general') =>
      checkedRoute(
        `/projects/${id}/settings${search({ [RouteParam.Section]: section === 'general' ? undefined : section })}`,
      ),
  }
}
