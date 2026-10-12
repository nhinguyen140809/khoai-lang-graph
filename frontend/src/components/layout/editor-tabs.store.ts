import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorage } from '@/lib/browser-storage.utils'

import { editorTabIconNames } from './editor-tabs.config'

const editorTabSchema = z.object({
  /** Unique in its group, for example the id of the run or the item. */
  id: z.string(),
  title: z.string(),
  href: z.string(),
  /** What the tab shows; without it, the tab shows the icon of its feature. */
  icon: z.enum(editorTabIconNames).optional(),
})

/** One open editor: what a tab shows and the address it opens. */
export type EditorTab = z.infer<typeof editorTabSchema>

const persistedTabsSchema = z.object({
  groups: z.record(z.string(), z.array(editorTabSchema)),
  lastHrefs: z.record(z.string(), z.string()),
})

type PersistedTabs = z.infer<typeof persistedTabsSchema>

interface OpenTabOptions {
  /** The address of the tab to open the new tab after; without it, the tab opens last. */
  after?: string | undefined
}

interface EditorTabsState extends PersistedTabs {
  /**
   * Adds the tab after the tab of `options.after`, like an editor opens a file next to the one in
   * view, or at the end. A tab that is open already keeps its place and takes the new title.
   */
  openTab: (group: string, tab: EditorTab, options?: OpenTabOptions) => void
  closeTab: (group: string, id: string) => void
  setLastHref: (group: string, href: string) => void
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

// Changes are stored only once the stored tabs have been read.
let storageRead = false

/**
 * The editor tabs of every project on this device; a group is one project, and holds the tabs of every feature.
 * AppFrame reads them after the first render.
 */
export const useEditorTabsStore = create<EditorTabsState>()(
  persist(
    (set) => ({
      groups: {},
      lastHrefs: {},
      openTab: (group, tab, { after } = {}) => {
        set((state) => {
          const tabs = state.groups[group] ?? []
          const index = tabs.findIndex(({ id }) => id === tab.id)
          const current = index === -1 ? undefined : tabs[index]
          if (
            current?.title === tab.title &&
            current.href === tab.href &&
            current.icon === tab.icon
          ) {
            return state
          }
          let next: EditorTab[]
          if (index !== -1) {
            next = tabs.with(index, tab)
          } else {
            const afterIndex = tabs.findIndex(({ href }) => href === after)
            next = afterIndex === -1 ? [...tabs, tab] : tabs.toSpliced(afterIndex + 1, 0, tab)
          }
          return { groups: { ...state.groups, [group]: next } }
        })
      },
      closeTab: (group, id) => {
        set((state) => {
          const tabs = state.groups[group] ?? []
          const closed = tabs.find((tab) => tab.id === id)
          // A page that is closed is not the page to return to.
          const lastHrefs = Object.fromEntries(
            Object.entries(state.lastHrefs).filter(([, href]) => href !== closed?.href),
          )
          return {
            groups: { ...state.groups, [group]: tabs.filter((tab) => tab.id !== id) },
            lastHrefs,
          }
        })
      },
      setLastHref: (group, href) => {
        set((state) =>
          state.lastHrefs[group] === href
            ? state
            : { lastHrefs: { ...state.lastHrefs, [group]: href } },
        )
      },
    }),
    {
      name: 'khoailanggraph-editor-tabs',
      skipHydration: true,
      storage: persistStorage<PersistedTabs>({ ready: () => storageRead }),
      onRehydrateStorage: () => () => {
        storageRead = true
      },
      partialize: ({ groups, lastHrefs }): PersistedTabs => ({ groups, lastHrefs }),
      merge: (persisted, current) => {
        const stored = parseStored(persistedTabsSchema, persisted)
        return {
          ...current,
          groups: mergeGroups(stored?.groups ?? {}, current.groups),
          lastHrefs: { ...stored?.lastHrefs, ...current.lastHrefs },
        }
      },
    },
  ),
)

/** The tab to show after closing tab `id`: the next one, else the previous one. */
export function neighborTab(tabs: EditorTab[], id: string): EditorTab | undefined {
  const index = tabs.findIndex((tab) => tab.id === id)
  if (index === -1) return undefined
  return tabs[index + 1] ?? tabs[index - 1]
}
