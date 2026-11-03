import { modelSettingKeys } from '../model-settings.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the settings', key: modelSettingKeys.list(), wider: modelSettingKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the settings and every query of the model settings',
    first: modelSettingKeys.list(),
    second: modelSettingKeys.all(),
  },
]
