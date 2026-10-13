import type { Route } from 'next'

/**
 * The query parameters of the pages. The functions below write them and the pages read them, so
 * that both use the same names.
 */
export const RouteParam = {
  /** Opens the export dialog of the artifacts; it has no value. */
  Export: 'export',
  /** The step of a run shown in the workflow. */
  Step: 'step',
  /** The node of the graph of a run chosen in the workflow, for a node that has no step. */
  Node: 'node',
  /** The section of the settings shown. */
  Section: 'section',
  /** The view of the traceability shown. */
  View: 'view',
  /** The gap of coverage that filters the matrix of the traceability. */
  Gap: 'gap',
} as const

/** The sections of the settings of a project; the first one is the page without a section. */
export const projectSettingsSections = ['general', 'runs', 'models'] as const

export type ProjectSettingsSection = (typeof projectSettingsSections)[number]

/**
 * The address, checked against the pages of the app as `Link` checks its `href`: a path that no
 * folder of `src/app/` has is a type error.
 */
function checkedRoute<T extends string>(href: Route<T>): Route {
  return href as Route
}

/** The query of an address, from the parameters given; empty when none is. */
function search(params: Readonly<Record<string, string | undefined>>): '' | `?${string}` {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) query.set(name, value)
  }
  const text = query.toString()
  return text === '' ? '' : `?${text}`
}

/** The console of a project, the page a project opens on. */
export function consoleHref(projectId: string): Route {
  return checkedRoute(`/projects/${encodeURIComponent(projectId)}/console`)
}

/** The console that one thread holds. */
export function threadHref(projectId: string, threadId: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/console/${encodeURIComponent(threadId)}`,
  )
}

/** The address under which the reviews of the runs of a project are; it is no page itself. */
export function reviewsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/review`
}

/** The review of a run that waits at a checkpoint. */
export function reviewHref(projectId: string, runId: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/review/${encodeURIComponent(runId)}`,
  )
}

/** The artifacts of a project. */
export function artifactsHref(projectId: string): Route {
  return checkedRoute(`/projects/${encodeURIComponent(projectId)}/artifacts`)
}

/** The artifacts with the export dialog open. */
export function artifactsExportHref(projectId: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/artifacts${search({ [RouteParam.Export]: '' })}`,
  )
}

/** An artifact, shown as a document. */
export function artifactHref(projectId: string, artifactId: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}`,
  )
}

/** One item of an artifact. */
export function itemHref(projectId: string, itemId: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/artifacts/items/${encodeURIComponent(itemId)}`,
  )
}

/** The search of the items of a project. */
export function searchHref(projectId: string): Route {
  return checkedRoute(`/projects/${encodeURIComponent(projectId)}/search`)
}

/** The runs of a project. */
export function workflowHref(projectId: string): Route {
  return checkedRoute(`/projects/${encodeURIComponent(projectId)}/workflow`)
}

/** A run, and one of its steps when `stepId` is given. */
export function runHref(projectId: string, runId: string, stepId?: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(runId)}${search({ [RouteParam.Step]: stepId })}`,
  )
}

/** A run with a node of its graph chosen, for a node that has no step. */
export function runNodeHref(projectId: string, runId: string, nodeId: string): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(runId)}${search({ [RouteParam.Node]: nodeId })}`,
  )
}

/** The traceability of a project, with the view and the gap chosen. */
export function traceabilityHref(
  projectId: string,
  { view, gap }: { view?: 'issues'; gap?: string } = {},
): Route {
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/traceability${search({ [RouteParam.View]: view, [RouteParam.Gap]: gap })}`,
  )
}

/** A section of the settings of a project. */
export function settingsHref(
  projectId: string,
  section: ProjectSettingsSection = 'general',
): Route {
  const shown = section === 'general' ? undefined : section
  return checkedRoute(
    `/projects/${encodeURIComponent(projectId)}/settings${search({ [RouteParam.Section]: shown })}`,
  )
}
