import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  theme: Theme
  /**
   * One-off model overrides per agent role (`provider:model`), sent with the next run as the
   * `models` override. Saved per-user defaults are server state (GET/PUT
   * /api/v1/me/model-settings) and belong in TanStack Query, not here.
   */
  modelOverrides: Partial<Record<string, string>>
  setTheme: (theme: Theme) => void
  setModelOverride: (role: string, modelId: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      modelOverrides: {},
      setTheme: (theme) => {
        set({ theme })
      },
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
    { name: 'khoailanggraph-settings' },
  ),
)
