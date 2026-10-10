import {
  FileIcon,
  FileTextIcon,
  type LucideIcon,
  PlayIcon,
  SettingsIcon,
  TableIcon,
} from 'lucide-react'

/** What an editor tab can show; each has its icon. */
export const editorTabIconNames = ['artifact', 'item', 'run', 'view', 'settings'] as const

export type EditorTabIcon = (typeof editorTabIconNames)[number]

/**
 * The icon of a tab by what it shows: an artifact as a document, one item, a run, a view such as
 * the traceability matrix, or settings. A tab without an icon name shows the icon of its feature
 * on the activity bar.
 */
export const editorTabIcons = {
  artifact: FileTextIcon,
  item: FileIcon,
  run: PlayIcon,
  view: TableIcon,
  settings: SettingsIcon,
} as const satisfies Record<EditorTabIcon, LucideIcon>
