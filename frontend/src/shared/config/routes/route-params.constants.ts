/**
 * The query parameters of the pages. The functions of the routes write them and the pages read
 * them, so that both use the same names.
 */
export const RouteParam = {
  /** The page to return to after signing in, on the sign-in and account pages. */
  Next: 'next',
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

/** The sections of the settings of the user; the first one is the page without a section. */
export const userSettingsSections = [
  'profile',
  'password',
  'preferences',
  'models',
  'usage',
  'sessions',
] as const

export type UserSettingsSection = (typeof userSettingsSections)[number]

/** The sections of the settings of a project; the first one is the page without a section. */
export const projectSettingsSections = ['general', 'runs', 'models'] as const

export type ProjectSettingsSection = (typeof projectSettingsSections)[number]
