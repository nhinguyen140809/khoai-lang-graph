'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { replaceUserSettings, userSettingsKeys } from '@/modules/user/entities'
import { reloadTo } from '@/shared/lib/url'
import type { View } from '@/shared/lib/view'

/**
 * Chooses the view of the app for the user: saves it in their settings, so that it is chosen once
 * for every device, then opens `href`, the start page of the view on the host that shows it. The
 * host is another site, so the page loads again.
 */
export function useChooseView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ view }: { view: View; href: string }) =>
      replaceUserSettings({ preferred_view: view }),
    onSuccess: async (_settings, { href }) => {
      await queryClient.invalidateQueries({ queryKey: userSettingsKeys.all() })
      reloadTo(href)
    },
  })
}
