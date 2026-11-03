import { userSettingsKeys } from '../user-settings.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the settings', key: userSettingsKeys.detail(), wider: userSettingsKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the settings and every query of the settings',
    first: userSettingsKeys.detail(),
    second: userSettingsKeys.all(),
  },
]
