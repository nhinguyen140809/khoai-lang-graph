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

/** The address of a page of a project, each part encoded, with the query parameters given. */
function projectPage(
  projectId: string,
  parts: readonly string[],
  query: Readonly<Record<string, string | undefined>> = {},
): Route {
  const path = `/projects/${[projectId, ...parts].map(encodeURIComponent).join('/')}`
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) params.set(name, value)
  }
  const text = params.toString()
  return (text === '' ? path : `${path}?${text}`) as Route
}

/** The console of a project, the page a project opens on. */
export function consoleHref(projectId: string): Route {
  return projectPage(projectId, ['console'])
}

/** The console that one thread holds. */
export function threadHref(projectId: string, threadId: string): Route {
  return projectPage(projectId, ['console', threadId])
}

/** The address under which the reviews of the runs of a project are. */
export function reviewsPath(projectId: string): Route {
  return projectPage(projectId, ['review'])
}

/** The review of a run that waits at a checkpoint. */
export function reviewHref(projectId: string, runId: string): Route {
  return projectPage(projectId, ['review', runId])
}

/** The artifacts of a project. */
export function artifactsHref(projectId: string): Route {
  return projectPage(projectId, ['artifacts'])
}

/** The artifacts with the export dialog open. */
export function artifactsExportHref(projectId: string): Route {
  return projectPage(projectId, ['artifacts'], { [RouteParam.Export]: '' })
}

/** An artifact, shown as a document. */
export function artifactHref(projectId: string, artifactId: string): Route {
  return projectPage(projectId, ['artifacts', artifactId])
}

/** One item of an artifact. */
export function itemHref(projectId: string, itemId: string): Route {
  return projectPage(projectId, ['artifacts', 'items', itemId])
}

/** The search of the items of a project. */
export function searchHref(projectId: string): Route {
  return projectPage(projectId, ['search'])
}

/** The runs of a project. */
export function workflowHref(projectId: string): Route {
  return projectPage(projectId, ['workflow'])
}

/** A run, and one of its steps when `stepId` is given. */
export function runHref(projectId: string, runId: string, stepId?: string): Route {
  return projectPage(projectId, ['workflow', runId], { [RouteParam.Step]: stepId })
}

/** A run with a node of its graph chosen, for a node that has no step. */
export function runNodeHref(projectId: string, runId: string, nodeId: string): Route {
  return projectPage(projectId, ['workflow', runId], { [RouteParam.Node]: nodeId })
}

/** The traceability of a project, with the view and the gap chosen. */
export function traceabilityHref(
  projectId: string,
  { view, gap }: { view?: 'issues'; gap?: string } = {},
): Route {
  return projectPage(projectId, ['traceability'], {
    [RouteParam.View]: view,
    [RouteParam.Gap]: gap,
  })
}

/** A section of the settings of a project. */
export function settingsHref(
  projectId: string,
  section: ProjectSettingsSection = 'general',
): Route {
  return projectPage(projectId, ['settings'], {
    [RouteParam.Section]: section === 'general' ? undefined : section,
  })
}
