import {
  FileStackIcon,
  FolderInputIcon,
  GitForkIcon,
  type LucideIcon,
  NetworkIcon,
  SearchIcon,
  SettingsIcon,
  SquareChevronRightIcon,
} from 'lucide-react'
import type { Route } from 'next'

/** The features of a project; each is a URL segment under /projects/{projectId}/. */
export const projectFeatures = [
  'session',
  'search',
  'artifacts',
  'workflow',
  'traceability',
  'settings',
] as const

export type ProjectFeature = (typeof projectFeatures)[number]

export interface ActivityItemConfig {
  label: string
  icon: LucideIcon
  /** The feature the item opens. An item without one is shown disabled, as planned for later. */
  feature?: ProjectFeature
  /** Shown in the tooltip of a disabled item. */
  note?: string
}

/** The items of the activity bar, top to bottom. */
export const activityItems: ActivityItemConfig[] = [
  { label: 'Session', icon: SquareChevronRightIcon, feature: 'session' },
  { label: 'Search', icon: SearchIcon, feature: 'search' },
  { label: 'Artifacts', icon: FileStackIcon, feature: 'artifacts' },
  { label: 'Workflow', icon: NetworkIcon, feature: 'workflow' },
  { label: 'Traceability', icon: GitForkIcon, feature: 'traceability' },
  { label: 'Sources', icon: FolderInputIcon, note: 'Uploaded documents, planned for later' },
]

/** Items pinned to the bottom of the activity bar. */
export const activityFooterItems: ActivityItemConfig[] = [
  { label: 'Settings', icon: SettingsIcon, feature: 'settings' },
]

export function featureHref(projectId: string, feature: ProjectFeature): Route {
  return `/projects/${encodeURIComponent(projectId)}/${feature}` as Route
}

/** The editor tab group of one feature of one project. */
export function featureTabGroup(projectId: string, feature: ProjectFeature): string {
  return `${projectId}:${feature}`
}

/** The feature of a project page, from its pathname. */
export function featureOfPathname(pathname: string): ProjectFeature | null {
  const segment = /^\/projects\/[^/]+\/([^/]+)/.exec(pathname)?.[1]
  return projectFeatures.find((feature) => feature === segment) ?? null
}

/** The icon of a feature on the activity bar. */
export function featureIcon(feature: ProjectFeature): LucideIcon {
  const item = [...activityItems, ...activityFooterItems].find((entry) => entry.feature === feature)
  return item?.icon ?? FileStackIcon
}
