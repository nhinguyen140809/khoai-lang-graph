import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  parseStored,
  persistStorageByEntry,
  storageKey,
} from '@/shared/lib/storage/browser-storage.utils'

import {
  type EditorTab,
  type PersistedTabs,
  persistedTabsSchema,
  type StoredTabGroup,
} from './editor-tabs.types'
import {
  joinTabGroups,
  placeTab,
  splitTabGroups,
  withEntry,
  withoutEntry,
} from './editor-tabs.utils'

interface OpenTabOptions {
  /** Opens the tab as a kept tab instead of the preview tab of its group. */
  keep?: boolean
}

/** The tab strips of every group, which are stored, and what the tabs keep for the session only. */
interface EditorTabsState {
  /** By group, the open tabs in the order of the strip. Stored. */
  groups: Record<string, EditorTab[]>
  /**
   * By group, the id of its preview tab: the tab that the next page opened replaces, until the
   * user keeps it. A group has one preview tab at most. Stored.
   */
  preview: Record<string, string>
  /** By group, the id of the tab whose page is on screen; none while a page without a tab is. */
  onScreen: Record<string, string>
  /** By group, the id of the tab whose page was on screen last, kept after the page leaves. */
  lastShown: Record<string, string>
  /** The address of a page asked to be kept before its tab opened; the next tab of it is kept. */
  keepNext: string | null
  /**
   * Opens the tab of the page on screen, or gives an open tab its new title. A new tab is the
   * preview tab of its group: it takes the place of the preview tab open, else it goes after the
   * tab shown last, as an editor opens a file next to the one in view, else at the end. A new
   * kept tab goes after the tab shown last too, and leaves the preview tab as it is.
   */
  openTab: (group: string, tab: EditorTab, options?: OpenTabOptions) => void
  /** Keeps tab `id` open when it is the preview tab of its group. */
  keepTab: (group: string, id: string) => void
  /**
   * Keeps the tab of the page at `href`: at once when it is the preview tab of its group, else when
   * its tab opens, for a double click whose first click is still opening the page.
   */
  keepPage: (href: string) => void
  /** The page of the tab leaves the screen. */
  leaveTab: (group: string, id: string) => void
  /** Closes the tabs `ids` of the group at once: one tab, every tab but one, or all of them. */
  closeTabs: (group: string, ids: readonly string[]) => void
}

/**
 * The editor tabs of every tab group on this device; a group is the strip of one `Workspace`,
 * named by its layout, and holds the tabs of every feature. `useRestoreFrame` reads them after the
 * first render, before the pages open theirs. Each group is stored under a key of its own, and a
 * browser tab writes only the groups it changed, so that a browser tab on one project never writes
 * its old copy of another project over the tabs opened there since.
 */
export const useEditorTabsStore = create<EditorTabsState>()(
  persist(
    (set) => ({
      groups: {},
      preview: {},
      onScreen: {},
      lastShown: {},
      keepNext: null,
      openTab: (group, tab, options = {}) => {
        set((state) => {
          const asked = state.keepNext === tab.href
          const keep = options.keep === true || asked
          const tabs = state.groups[group] ?? []
          const isOpen = tabs.some(({ id }) => id === tab.id)
          const previewId = state.preview[group]
          const replaces = !isOpen && !keep && tabs.some(({ id }) => id === previewId)
          const placed = replaces
            ? tabs.map((open) => (open.id === previewId ? tab : open))
            : placeTab(tabs, tab, state.lastShown[group])
          let preview = state.preview
          if (keep) preview = withoutEntry(preview, group, tab.id)
          else if (!isOpen) preview = withEntry(preview, group, tab.id)
          return {
            groups: placed === tabs ? state.groups : { ...state.groups, [group]: placed },
            preview,
            keepNext: asked ? null : state.keepNext,
            onScreen: withEntry(state.onScreen, group, tab.id),
            lastShown: withEntry(state.lastShown, group, tab.id),
          }
        })
      },
      keepTab: (group, id) => {
        set((state) => ({ preview: withoutEntry(state.preview, group, id) }))
      },
      keepPage: (href) => {
        set((state) => {
          for (const [group, tabs] of Object.entries(state.groups)) {
            const open = tabs.find((tab) => tab.href === href)
            if (open !== undefined) return { preview: withoutEntry(state.preview, group, open.id) }
          }
          return { keepNext: href }
        })
      },
      leaveTab: (group, id) => {
        set((state) => ({ onScreen: withoutEntry(state.onScreen, group, id) }))
      },
      closeTabs: (group, ids) => {
        set((state) => {
          const closing = new Set(ids)
          const withoutClosed = (record: Record<string, string>) => {
            const id = record[group]
            return id !== undefined && closing.has(id) ? withoutEntry(record, group, id) : record
          }
          return {
            groups: {
              ...state.groups,
              [group]: (state.groups[group] ?? []).filter((tab) => !closing.has(tab.id)),
            },
            preview: withoutClosed(state.preview),
            // A closed tab is not the tab to open the next one after.
            lastShown: withoutClosed(state.lastShown),
          }
        })
      },
    }),
    {
      name: storageKey('editor-tabs'),
      skipHydration: true,
      // Changes are stored only once the stored tabs have been read.
      storage: persistStorageByEntry<PersistedTabs, StoredTabGroup>({
        split: splitTabGroups,
        join: joinTabGroups,
        ready: (): boolean => useEditorTabsStore.persist.hasHydrated(),
      }),
      partialize: ({ groups, preview }): PersistedTabs => ({ groups, preview }),
      merge: (persisted, current) => {
        const stored = parseStored(persistedTabsSchema, persisted)
        if (stored === undefined) return current
        return { ...current, groups: stored.groups, preview: stored.preview ?? {} }
      },
    },
  ),
)
