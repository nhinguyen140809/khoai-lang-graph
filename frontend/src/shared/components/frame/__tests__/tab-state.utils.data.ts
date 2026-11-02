import { useEditorTabsStore } from '../tabs/editor-tabs.store'

/** What the editor tabs hold for one group: its tabs, and the ids of its three marked tabs, or null. */
export function tabsOf(group: string) {
  const state = useEditorTabsStore.getState()
  return {
    tabs: state.groups[group] ?? [],
    preview: state.preview[group] ?? null,
    onScreen: state.onScreen[group] ?? null,
    lastShown: state.lastShown[group] ?? null,
  }
}

/**
 * Puts the given state of one group in the editor tabs, as the pages leave it: only what is given
 * is set, and the other groups and the rest of this group stay as they are.
 */
export function seedTabs(
  group: string,
  { tabs, preview, onScreen, lastShown }: Partial<ReturnType<typeof tabsOf>>,
) {
  useEditorTabsStore.setState((state) => ({
    groups: tabs === undefined ? state.groups : { ...state.groups, [group]: tabs },
    preview: markedTab(state.preview, group, preview),
    onScreen: markedTab(state.onScreen, group, onScreen),
    lastShown: markedTab(state.lastShown, group, lastShown),
  }))
}

/** The record with the marked tab of a group set, or removed for null; unchanged for undefined. */
function markedTab(record: Record<string, string>, group: string, id: string | null | undefined) {
  if (id === undefined) return record
  if (id !== null) return { ...record, [group]: id }
  return Object.fromEntries(Object.entries(record).filter(([key]) => key !== group))
}
