import { FolderIcon, type LucideIcon, MessageSquareIcon, SettingsIcon } from 'lucide-react'
import type { Route } from 'next'

export interface SidebarNavItemConfig {
  label: string
  icon: LucideIcon
  /** Route the item links to. An item without `href` is shown disabled. */
  href?: Route
  /** Shown when the sidebar is collapsed to icons. Defaults to `label`. */
  tooltip?: string
}

export type SidebarGroupId = 'threads' | 'projects'

export interface SidebarNavGroupConfig {
  id: SidebarGroupId
  label: string
  items: SidebarNavItemConfig[]
}

/** Groups in the scrollable part of the sidebar, top to bottom. */
export const sidebarGroups: SidebarNavGroupConfig[] = [
  {
    id: 'threads',
    label: 'Threads',
    items: [{ label: 'New thread', icon: MessageSquareIcon, href: '/' }],
  },
  {
    id: 'projects',
    label: 'Projects',
    items: [{ label: 'No projects yet', icon: FolderIcon, tooltip: 'Projects' }],
  },
]

/** Items pinned to the bottom of the sidebar. */
export const sidebarFooterItems: SidebarNavItemConfig[] = [
  { label: 'Settings', icon: SettingsIcon, href: '/settings' },
]
