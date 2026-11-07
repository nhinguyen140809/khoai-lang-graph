import { useChosenRunSettingsStore } from '../stores/chosen-run-settings.store'

/** The settings chosen for the next run of a thread; undefined when none is chosen or without a thread. */
export function useChosenRunSettings(threadId: string | null) {
  const settings = useChosenRunSettingsStore((state) =>
    threadId === null ? undefined : state.settingsByThread[threadId],
  )
  return settings
}

/** The function that forgets the settings chosen for a thread, once its message is sent. */
export function useClearChosenRunSettings(): (threadId: string) => void {
  return useChosenRunSettingsStore((state) => state.clearSettings)
}
export { useChosenRunSettingsStore } from './useChosenRunSettingsStore'
