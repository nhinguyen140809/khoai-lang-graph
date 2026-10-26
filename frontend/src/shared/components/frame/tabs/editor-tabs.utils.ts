import { omit } from '@/shared/lib/collections'

import {
  type EditorTab,
  type PersistedTabs,
  type StoredTabGroup,
  storedTabGroupSchema,
} from './editor-tabs.types'

/** The tab of a group set in the record, or the same record when the group has it already. */
export function setGroupTab(record: Record<string, string>, group: string, tabId: string) {
  return record[group] === tabId ? record : { ...record, [group]: tabId }
}

/** The record without the tab of a group when the group holds that tab, else the same record. */
export function clearGroupTab(record: Record<string, string>, group: string, tabId: string) {
  if (record[group] !== tabId) return record
  return omit(record, [group])
}

/** The tabs with `tab` in them: in place of the open tab of the same id, else after `after`. */
export function placeTab(
  tabs: EditorTab[],
  tab: EditorTab,
  after: string | undefined,
): EditorTab[] {
  const index = tabs.findIndex(({ id }) => id === tab.id)
  const open = index === -1 ? undefined : tabs[index]
  if (open !== undefined) {
    const isSame = open.title === tab.title && open.href === tab.href && open.icon === tab.icon
    return isSame ? tabs : tabs.with(index, tab)
  }
  const afterIndex = tabs.findIndex(({ id }) => id === after)
  return afterIndex === -1 ? [...tabs, tab] : tabs.toSpliced(afterIndex + 1, 0, tab)
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
  const isKept = (tab: EditorTab) => !closing.includes(tab.id)
  return tabs.slice(index + 1).find(isKept) ?? tabs.slice(0, index).findLast(isKept)
}

/** The stored tabs of each group that has tabs open, with the id of its preview tab. */
export function splitTabGroups({ groups, preview = {} }: PersistedTabs) {
  const entries: Record<string, StoredTabGroup> = {}
  for (const [group, tabs] of Object.entries(groups)) {
    if (tabs.length === 0) continue
    const previewId = preview[group]
    entries[group] = previewId === undefined ? { tabs } : { tabs, preview: previewId }
  }
  return entries
}

/** The tabs of the groups read from storage, without the groups of another shape. */
export function joinTabGroups(entries: Record<string, unknown>): PersistedTabs {
  const groups: Record<string, EditorTab[]> = {}
  const preview: Record<string, string> = {}
  for (const [group, entry] of Object.entries(entries)) {
    const stored = storedTabGroupSchema.safeParse(entry)
    if (!stored.success) continue
    groups[group] = stored.data.tabs
    if (stored.data.preview !== undefined) preview[group] = stored.data.preview
  }
  return { groups, preview }
}
