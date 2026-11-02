import type { ReactNode } from 'react'

import { omit } from '@/shared/lib/collections'

import type { TabIcons } from '../destinations/destination.types'
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
 * `setGroupTab`, or for no tab (`undefined`) the record without the group, whatever tab it held;
 * the same record if unchanged. `clearGroupTab` removes only the tab that it is given.
 */
export function setGroupTabOrNone(
  record: Record<string, string>,
  group: string,
  tabId: string | undefined,
): Record<string, string> {
  if (tabId === undefined) return record[group] === undefined ? record : omit(record, [group])
  return setGroupTab(record, group, tabId)
}

/**
 * Where a tab that opens goes in its group, and which tab is then the preview tab. A tab that
 * takes the place of `replaceTabId` keeps that tab's state, kept or preview. Else a tab already
 * open stays where it is. Else a new kept tab goes after the tab shown last, and a new preview tab
 * takes the place of the preview tab open, else goes after the tab shown last too.
 */
export function placeOpenedTab({
  tabs,
  tab,
  previewId,
  lastShownId,
  isKept,
  replaceTabId,
}: {
  tabs: EditorTab[]
  tab: EditorTab
  previewId: string | undefined
  lastShownId: string | undefined
  isKept: boolean
  replaceTabId: string | null
}): { tabs: EditorTab[]; previewId: string | undefined } {
  const isOpen = tabs.some(({ id }) => id === tab.id)
  const takenId =
    replaceTabId !== null && !isOpen && tabs.some(({ id }) => id === replaceTabId)
      ? replaceTabId
      : null
  if (takenId !== null) {
    return {
      tabs: tabs.map((open) => (open.id === takenId ? tab : open)),
      previewId: previewId === takenId ? tab.id : previewId,
    }
  }
  if (isKept) {
    return {
      tabs: placeTab(tabs, tab, lastShownId),
      previewId: previewId === tab.id ? undefined : previewId,
    }
  }
  if (isOpen) return { tabs: placeTab(tabs, tab, lastShownId), previewId }
  const isReplacingPreview = tabs.some(({ id }) => id === previewId)
  return {
    tabs: isReplacingPreview
      ? tabs.map((open) => (open.id === previewId ? tab : open))
      : placeTab(tabs, tab, lastShownId),
    previewId: tab.id,
  }
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

/** The icon that the first of the sets of icons given has for a name, or nothing when none has one. A set that gives null for a name has none for it. */
export function tabIconOf(sets: Iterable<TabIcons>, name: string): ReactNode {
  for (const icons of sets) {
    const icon = typeof icons === 'function' ? icons(name) : icons[name]
    if (icon !== undefined && icon !== null) return icon
  }
  return undefined
}
