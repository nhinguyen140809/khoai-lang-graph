import { type SettingsSection, settingsSections } from './settings.types'

/** The section that an address names; an unknown one is the first. */
export function settingsSectionOf(value: string | null): SettingsSection {
  return settingsSections.find((section) => section === value) ?? 'profile'
}
