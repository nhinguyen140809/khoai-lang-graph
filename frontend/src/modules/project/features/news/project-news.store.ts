import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { browserPersistOptions } from '@/shared/lib/storage'

const persistedSeenSchema = z.object({
  /** By project id: the last activity of the project that the user has seen, as an ISO date. */
  seenAt: z.record(z.string(), z.string()),
})

type PersistedSeen = z.infer<typeof persistedSeenSchema>

interface SeenState extends PersistedSeen {
  markSeen: (projectId: string, activityAt: string) => void
}

/**
 * The last activity of each project that the user has seen, which tells a project with news from
 * one without. It is device-local, so it is kept in the browser. It is read after the first render
 * (`useRestoreSeenProjects`), so the server HTML and the first client render use the defaults.
 */
export const useProjectNewsStore = create<SeenState>()(
  persist(
    (set) => ({
      seenAt: {},
      markSeen: (projectId, activityAt) => {
        set((state) =>
          // Later activity only: opening an older view of a project never turns news into old.
          (state.seenAt[projectId] ?? '') >= activityAt
            ? state
            : { seenAt: { ...state.seenAt, [projectId]: activityAt } },
        )
      },
    }),
    browserPersistOptions({
      name: 'project-seen',
      schema: persistedSeenSchema,
      partialize: ({ seenAt }): PersistedSeen => ({ seenAt }),
      hasHydrated: (): boolean => useProjectNewsStore.persist.hasHydrated(),
    }),
  ),
)
