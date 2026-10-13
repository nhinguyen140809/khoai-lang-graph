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
  preview: z.record(z.string(), z.string()).optional(),
})

type PersistedTabs = z.infer<typeof persistedTabsSchema>

interface OpenTabOptions {
  /** Opens the tab as a kept tab instead of the preview tab of its group. */
  keep?: boolean
}

interface EditorTabsState {
  /** By group, the open tabs in the order of the strip. */
  groups: Record<string, EditorTab[]>
  /**
   * By group, the id of its preview tab: the tab that the next page opened replaces, until the
   * user keeps it. A group has one preview tab at most.
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
  closeTab: (group: string, id: string) => void
  /** Closes the tabs `ids` of the group at once, such as every tab but one. */
  closeTabs: (group: string, ids: readonly string[]) => void
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
 * The tabs and the preview tabs once the stored ones are read. A page opened before that has a
 * preview tab: when the stored tabs kept it, it stays kept; otherwise it is the preview tab of its
 * group, and the stored preview tab leaves the strip, as the next page opened would replace it.
 */
function mergeTabs(
  stored: PersistedTabs | undefined,
  current: Pick<EditorTabsState, 'groups' | 'preview'>,
): Pick<EditorTabsState, 'groups' | 'preview'> {
  const groups = mergeGroups(stored?.groups ?? {}, current.groups)
  const storedPreview = stored?.preview ?? {}
  const preview: Record<string, string> = {}
  for (const group of new Set([...Object.keys(storedPreview), ...Object.keys(current.preview)])) {
    const storedId = storedPreview[group]
    const currentId = current.preview[group]
    const keptBefore =
      currentId !== storedId && (stored?.groups[group] ?? []).some(({ id }) => id === currentId)
    if (currentId === undefined || keptBefore) {
      if (storedId !== undefined) preview[group] = storedId
      continue
    }
    preview[group] = currentId
    if (storedId !== undefined && storedId !== currentId) {
      groups[group] = (groups[group] ?? []).filter(({ id }) => id !== storedId)
    }
  }
  // A stored preview tab that is not among the stored tabs is dropped.
  const open = Object.entries(preview).filter(([group, id]) =>
    (groups[group] ?? []).some((tab) => tab.id === id),
  )
  return { groups, preview: Object.fromEntries(open) }
}

/**
 * The editor tabs of every project on this device; a group is one project, and holds the tabs of
 * every feature. Workbench reads them after the first render.
 */
export const useEditorTabsStore = create<EditorTabsState>()(
  persist(
    (set, get) => ({
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
      closeTab: (group, id) => {
        get().closeTabs(group, [id])
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
      storage: persistStorage<PersistedTabs>({
        ready: (): boolean => useEditorTabsStore.persist.hasHydrated(),
      }),
      partialize: ({ groups, preview }): PersistedTabs => ({ groups, preview }),
      merge: (persisted, current) => ({
        ...current,
        ...mergeTabs(parseStored(persistedTabsSchema, persisted), current),
      }),
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

/**
 * The tab to show after closing the tabs `closing`, among them tab `id`: the next tab that stays
 * open, else the previous one.
 */
export function neighborTab(
  tabs: EditorTab[],
  id: string,
  closing: readonly string[] = [id],
): EditorTab | undefined {
  const index = tabs.findIndex((tab) => tab.id === id)
  if (index === -1) return undefined
  const stays = (tab: EditorTab) => !closing.includes(tab.id)
  return tabs.slice(index + 1).find(stays) ?? tabs.slice(0, index).findLast(stays)
}
