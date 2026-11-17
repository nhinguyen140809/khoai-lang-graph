import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { browserPersistOptions } from '@/shared/lib/storage'

const persistedSideFeatureSchema = z.object({
  /** The id of the feature whose side panel is shown, once chosen; the editor is not tied to it. */
  chosen: z.string().nullable().default(null),
})

type PersistedSideFeature = z.infer<typeof persistedSideFeatureSchema>

interface SideFeatureState extends PersistedSideFeature {
  choose: (id: string) => void
}

/**
 * The feature whose side panel the user chose. It is device-local, so it is kept in the browser
 * and not on the server, and read after the first render (`useRestoreFrame`).
 */
export const useSideFeatureStore = create<SideFeatureState>()(
  persist(
    (set) => ({
      chosen: null,
      choose: (chosen) => {
        set({ chosen })
      },
    }),
    browserPersistOptions({
      name: 'side-feature',
      schema: persistedSideFeatureSchema,
      partialize: ({ chosen }): PersistedSideFeature => ({ chosen }),
      hasHydrated: (): boolean => useSideFeatureStore.persist.hasHydrated(),
    }),
  ),
)
