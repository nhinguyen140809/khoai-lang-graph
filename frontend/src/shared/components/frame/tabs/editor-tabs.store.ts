import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorageByEntry, storageKey } from '@/shared/lib/storage'
import { pathOf } from '@/shared/lib/url'

import {
  type EditorTab,
  type PersistedTabs,
  persistedTabsSchema,
  type StoredTabGroup,
} from './editor-tabs.types'
import {
  clearGroupTab,
  joinTabGroups,
  placeOpenedTab,
  setGroupTab,
  setGroupTabOrNone,
  splitTabGroups,
} from './editor-tabs.utils'

interface OpenTabOptions {
  /** Opens the tab as a kept tab instead of the preview tab of its group. */
  keep?: boolean
  /** The title is a stand-in until the page knows its own: a tab already open keeps its title. */
  isTitleProvisional?: boolean
}

/**
 * What a page asked of its tab before the tab opened: to be kept, and to take the place of an open
 * tab, which gives it the state of that tab, kept or preview, instead of a place of its own.
 */
interface PendingOpen {
  href: string
  keep: boolean
  replaceTabId: string | null
  /** What the opener calls the page, for the tab while the page does not know its own title. */
  title: string | null
}

/**
 * What the page at `href` was already asked of its tab, else nothing. A tab holds the page, so an
 * address meets its tab at the path: an item read in place in its document has the address of the
 * document with the item in a query.
 */
function pendingOf(state: Pick<EditorTabsState, 'pendingOpen'>, href: string): PendingOpen {
  const { pendingOpen } = state
  const page = pathOf(href)
  return pendingOpen?.href === page
    ? pendingOpen
    : { href: page, keep: false, replaceTabId: null, title: null }
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
  /** What the next tab of one page is asked to be when it opens; one page waits at a time. */
  pendingOpen: PendingOpen | null
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
  /** Asks the tab of the page at `href` to take the place of tab `tabId` when it opens. */
  replacePage: (href: string, tabId: string) => void
  /**
   * Gives the tab of the page at `href` the title that its opener calls it, for as long as the page
   * does not know its own, so that a page that fails to load still has a tab that names it.
   */
  namePage: (href: string, title: string) => void
  /** The page of the tab leaves the screen. */
  leaveTab: (group: string, id: string) => void
  /** Closes the tabs `ids` of the group at once: one tab, every tab but one, or all of them. */
  closeTabs: (group: string, ids: readonly string[]) => void
}

/**
 * The editor tabs of every tab group on this device; a group is the strip of one `TabbedWorkspace`,
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
      pendingOpen: null,
      openTab: (group, tab, options = {}) => {
        set((state) => {
          const pending = state.pendingOpen?.href === pathOf(tab.href) ? state.pendingOpen : null
          const tabs = state.groups[group] ?? []
          const open = tabs.find(({ id }) => id === tab.id)
          const providedTitle = open === undefined ? (pending?.title ?? tab.title) : open.title
          const titled =
            options.isTitleProvisional === true ? { ...tab, title: providedTitle } : tab
          const placed = placeOpenedTab({
            tabs,
            tab: titled,
            previewId: state.preview[group],
            lastShownId: state.lastShown[group],
            isKept: options.keep === true || pending?.keep === true,
            replaceTabId: pending?.replaceTabId ?? null,
          })
          return {
            groups: placed.tabs === tabs ? state.groups : { ...state.groups, [group]: placed.tabs },
            preview: setGroupTabOrNone(state.preview, group, placed.previewId),
            pendingOpen: pending === null ? state.pendingOpen : null,
            onScreen: setGroupTab(state.onScreen, group, tab.id),
            lastShown: setGroupTab(state.lastShown, group, tab.id),
          }
        })
      },
      keepTab: (group, id) => {
        set((state) => ({ preview: clearGroupTab(state.preview, group, id) }))
      },
      keepPage: (href) => {
        set((state) => {
          for (const [group, tabs] of Object.entries(state.groups)) {
            const open = tabs.find((tab) => pathOf(tab.href) === pathOf(href))
            if (open !== undefined) return { preview: clearGroupTab(state.preview, group, open.id) }
          }
          return { pendingOpen: { ...pendingOf(state, href), keep: true } }
        })
      },
      replacePage: (href, tabId) => {
        set((state) => ({ pendingOpen: { ...pendingOf(state, href), replaceTabId: tabId } }))
      },
      namePage: (href, title) => {
        set((state) => {
          // A tab that is open already has its title; nothing opens for the hint to name.
          const isOpen = Object.values(state.groups).some((tabs) =>
            tabs.some((tab) => pathOf(tab.href) === pathOf(href)),
          )
          return isOpen ? state : { pendingOpen: { ...pendingOf(state, href), title } }
        })
      },
      leaveTab: (group, id) => {
        set((state) => ({ onScreen: clearGroupTab(state.onScreen, group, id) }))
      },
      closeTabs: (group, ids) => {
        set((state) => {
          const closing = new Set(ids)
          const withoutClosed = (record: Record<string, string>) => {
            const id = record[group]
            return id !== undefined && closing.has(id) ? clearGroupTab(record, group, id) : record
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
