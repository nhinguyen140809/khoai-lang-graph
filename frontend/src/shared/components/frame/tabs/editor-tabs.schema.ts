import { z } from 'zod'

export const editorTabSchema = z.object({
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

export const persistedTabsSchema = z.object({
  groups: z.record(z.string(), z.array(editorTabSchema)),
  preview: z.record(z.string(), z.string()).optional(),
})

export type PersistedTabs = z.infer<typeof persistedTabsSchema>
