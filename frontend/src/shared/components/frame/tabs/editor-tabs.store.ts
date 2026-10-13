import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorage, storageKey } from '@/shared/lib/browser-storage.utils'

const editorTabSchema = z.object({
  /** Unique in its group, for example the id of the run or the item. */
  id: z.string(),
  title: z.string(),
  href: z.string(),
  /**
   * The name of the icon of what the tab shows, among the tab icons of the frame; without it, the
   * tab shows the icon of its feature.
   */
  icon: z.string().optional(),
})

/** One open editor: what a tab shows and the address it opens. */
export type EditorTab = z.infer<typeof editorTabSchema>

const persistedTabsSchema = z.object({
  groups: z.record(z.string(), z.array(editorTabSchema)),
})

type PersistedTabs = z.infer<typeof persistedTabsSchema>

interface EditorTabsState extends PersistedTabs {
  /** By group, the id of the tab whose page is on screen; none while a page without a tab is. */
  onScreen: Record<string, string>
  /** By group, the id of the tab whose page was on screen last, kept after the page leaves. */
  lastShown: Record<string, string>
  /**
   * Opens the tab of the page on screen, or gives an open tab its new title. A new tab goes after
   * the tab shown last, as an editor opens a file next to the one in view, else at the end.
   */
  openTab: (group: string, tab: EditorTab) => void
  /** The page of the tab leaves the screen. */
  leaveTab: (group: string, id: string) => void
  closeTab: (group: string, id: string) => void
}

/** The record with the entry of `key` set to `value`, or the same record when it has it already. */
function withEntry(record: Record<string, string>, key: string, value: string) {
  return record[key] === value ? record : { ...record, [key]: value }
}

/** The record without the entry of `key` when it holds `value`, else the same record. */
function withoutEntry(record: Record<string, string>, key: string, value: string) {
  if (record[key] !== value) return record
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key))
}

/** The tabs with `tab` in them: in place of the open tab of the same id, else after `after`. */
function placeTab(tabs: EditorTab[], tab: EditorTab, after: string | undefined): EditorTab[] {
  const index = tabs.findIndex(({ id }) => id === tab.id)
  const open = index === -1 ? undefined : tabs[index]
  if (open !== undefined) {
    const same = open.title === tab.title && open.href === tab.href && open.icon === tab.icon
    return same ? tabs : tabs.with(index, tab)
  }
  const afterIndex = tabs.findIndex(({ id }) => id === after)
  return afterIndex === -1 ? [...tabs, tab] : tabs.toSpliced(afterIndex + 1, 0, tab)
}

// Tabs opened before the stored ones were read are kept, after the stored ones.
function mergeGroups(
  stored: Record<string, EditorTab[]>,
  current: Record<string, EditorTab[]>,
): Record<string, EditorTab[]> {
  const merged = { ...stored }
  for (const [group, tabs] of Object.entries(current)) {
    const kept = merged[group] ?? []
    merged[group] = [...kept, ...tabs.filter((tab) => !kept.some(({ id }) => id === tab.id))]
  }
  return merged
}

/**
 * The editor tabs of every project on this device; a group is one project, and holds the tabs of
 * every feature. Workbench reads them after the first render.
 */
export const useEditorTabsStore = create<EditorTabsState>()(
  persist(
    (set) => ({
      groups: {},
      onScreen: {},
      lastShown: {},
      openTab: (group, tab) => {
        set((state) => {
          const tabs = state.groups[group] ?? []
          const placed = placeTab(tabs, tab, state.lastShown[group])
          return {
            groups: placed === tabs ? state.groups : { ...state.groups, [group]: placed },
            onScreen: withEntry(state.onScreen, group, tab.id),
            lastShown: withEntry(state.lastShown, group, tab.id),
          }
        })
      },
      leaveTab: (group, id) => {
        set((state) => ({ onScreen: withoutEntry(state.onScreen, group, id) }))
      },
      closeTab: (group, id) => {
        set((state) => ({
          groups: {
            ...state.groups,
            [group]: (state.groups[group] ?? []).filter((tab) => tab.id !== id),
          },
          // A closed tab is not the tab to open the next one after.
          lastShown: withoutEntry(state.lastShown, group, id),
        }))
      },
    }),
    {
      name: storageKey('editor-tabs'),
      skipHydration: true,
      // Changes are stored only once the stored tabs have been read.
      storage: persistStorage<PersistedTabs>({
        ready: (): boolean => useEditorTabsStore.persist.hasHydrated(),
      }),
      partialize: ({ groups }): PersistedTabs => ({ groups }),
      merge: (persisted, current) => {
        const stored = parseStored(persistedTabsSchema, persisted)
        return {
          ...current,
          groups: mergeGroups(stored?.groups ?? {}, current.groups),
        }
      },
    },
  ),
)

/**
 * The tab group of a project: one strip for every feature, so a tab stays open when the side
 * panel changes.
 */
export function projectTabGroup(projectId: string): string {
  return projectId
}

/** The tab to show after closing tab `id`: the next one, else the previous one. */
export function neighborTab(tabs: EditorTab[], id: string): EditorTab | undefined {
  const index = tabs.findIndex((tab) => tab.id === id)
  if (index === -1) return undefined
  return tabs[index + 1] ?? tabs[index - 1]
}
