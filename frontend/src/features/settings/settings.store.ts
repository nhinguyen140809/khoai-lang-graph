import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { persistStorage, storageKey } from '@/shared/lib/browser-storage.utils'

interface SettingsState {
  /**
   * One-off model overrides per agent role (`provider:model`), sent with the next run as the
   * `models` override. Saved per-user defaults are server state (GET/PUT
   * /api/v1/me/model-settings) and belong in TanStack Query, not here.
   */
  modelOverrides: Partial<Record<string, string>>
  setModelOverride: (role: string, modelId: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      modelOverrides: {},
      setModelOverride: (role, modelId) => {
        set((state) => {
          const modelOverrides = { ...state.modelOverrides }
          if (modelId === null) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by role name
            delete modelOverrides[role]
          } else {
            modelOverrides[role] = modelId
          }
          return { modelOverrides }
        })
      },
    }),
    { name: storageKey('settings'), storage: persistStorage() },
  ),
)
