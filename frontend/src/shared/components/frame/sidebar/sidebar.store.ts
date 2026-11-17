import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { browserPersistOptions } from '@/shared/lib/storage'

import { sidebarWidths } from './sidebar.constants'

const persistedSidebarSchema = z.object({
  open: z.boolean(),
  /** In pixels: the width of the side list while it is open. */
  width: z.number().positive(),
})

type PersistedSidebar = z.infer<typeof persistedSidebarSchema>

interface SidebarState extends PersistedSidebar {
  setOpen: (open: boolean) => void
  setWidth: (width: number) => void
}

/**
 * Whether the side list of the desk is open, and its width. They are device-local, so
 * they are kept in the browser and not on the server. They are read after the first render
 * (`useResizableSidebar`), so the server HTML and the first client render use the defaults.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      open: true,
      width: sidebarWidths.initial,
      setOpen: (open) => {
        set({ open })
      },
      setWidth: (width) => {
        set({ width })
      },
    }),
    browserPersistOptions({
      name: 'chat-sidebar',
      schema: persistedSidebarSchema,
      partialize: ({ open, width }): PersistedSidebar => ({ open, width }),
      hasHydrated: (): boolean => useSidebarStore.persist.hasHydrated(),
    }),
  ),
)
