import type { Section } from './project-settings.types'

/** The address of a section of the settings of a project. */
export function settingsHref(projectId: string, section: Section): string {
  const base = `/projects/${encodeURIComponent(projectId)}/settings`
  return section === 'general' ? base : `${base}?section=${section}`
}
