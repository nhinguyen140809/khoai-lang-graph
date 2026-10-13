import type { EditorTab, PersistedTabs } from './editor-tabs.schema'

/** The tab strips of every group: the part of the editor tabs that is stored. */
export interface TabStrips {
  /** By group, the open tabs in the order of the strip. */
  groups: Record<string, EditorTab[]>
  /**
   * By group, the id of its preview tab: the tab that the next page opened replaces, until the
   * user keeps it. A group has one preview tab at most.
   */
  preview: Record<string, string>
}

/** The record with the entry of `key` set to `value`, or the same record when it has it already. */
export function withEntry(record: Record<string, string>, key: string, value: string) {
  return record[key] === value ? record : { ...record, [key]: value }
}

/** The record without the entry of `key` when it holds `value`, else the same record. */
export function withoutEntry(record: Record<string, string>, key: string, value: string) {
  if (record[key] !== value) return record
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key))
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
export function mergeTabs(stored: PersistedTabs | undefined, current: TabStrips): TabStrips {
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
