import { useChosenRunSettingsStore as useStore } from '../stores/chosen-run-settings.store'

/**
 * The writes of the store of the settings chosen for the next run of a thread, for the dialog that
 * changes them.
 */
export function useChosenRunSettingsStore() {
  const chooseSettings = useStore((state) => state.chooseSettings)
  const clearSettings = useStore((state) => state.clearSettings)
  return { chooseSettings, clearSettings }
}
