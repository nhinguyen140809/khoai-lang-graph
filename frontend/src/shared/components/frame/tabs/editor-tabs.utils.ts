import type { EditorTab } from './editor-tabs.schema'

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
