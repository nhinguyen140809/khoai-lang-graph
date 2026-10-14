import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replaceUserSettings, type UserSettingsBody } from '../settings.api'
import type { UserSettings } from '../settings.types'
import { userSettingsQueryKey, useUserSettings } from './useUserSettings'

// The fields of the settings that a replace sends; the others are kept by the server.
function settingsBody(settings: UserSettings): UserSettingsBody {
  const {
    theme,
    ui_language,
    default_output_language,
    default_run_config,
    notify_on_interrupt,
    notify_on_run_finished,
  } = settings
  return {
    theme,
    ui_language,
    default_output_language,
    default_run_config,
    notify_on_interrupt,
    notify_on_run_finished,
  }
}

/**
 * Saves a theme in the settings of the user, with their other fields as they are; it does nothing
 * before the settings load. A failure shows as a toast.
 */
export function useSaveTheme() {
  const settings = useUserSettings()
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: replaceUserSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(userSettingsQueryKey, saved)
    },
    onError: (error) => {
      toast.error(`The theme was not saved. ${error.message}`)
    },
  })
  return (theme: UserSettings['theme']) => {
    if (settings.data === undefined) return
    save.mutate({ ...settingsBody(settings.data), theme })
  }
}
