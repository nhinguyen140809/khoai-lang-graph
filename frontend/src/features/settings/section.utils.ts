import { type SettingsSection, settingsSections } from './settings.types'

/** The section that an address names; an unknown one is the first. */
export function settingsSectionOf(value: string | null): SettingsSection {
  return settingsSections.find((section) => section === value) ?? 'profile'
}

/** The address of a section of the settings of the user. */
export function userSettingsHref(section: SettingsSection): string {
  return section === 'profile' ? '/settings' : `/settings?section=${section}`
}
