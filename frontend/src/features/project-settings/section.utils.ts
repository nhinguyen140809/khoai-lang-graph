import { type Section, sections } from './project-settings.types'

/** The section that an address names; an unknown one is the first. */
export function sectionOf(value: string | null): Section {
  return sections.find((section) => section === value) ?? 'general'
}
