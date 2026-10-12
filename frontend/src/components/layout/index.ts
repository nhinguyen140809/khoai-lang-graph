// The frame of every screen. Code outside this folder imports it from here, so the files can move
// between the region folders; files inside the folder import each other with relative paths.
export type {
  Activity,
  FeatureActivity,
  PlannedActivity,
  TabIcons,
} from './activity-bar/activity.types'
export { ActivityBar } from './activity-bar/ActivityBar'
export { useCommandPaletteStore } from './command-palette/command-palette.store'
export { projectTabGroup, useEditorTabsStore } from './editor/editor-tabs.store'
export { EditorWithPanel } from './editor/EditorWithPanel'
export { useEditorTab } from './editor/hooks/useEditorTab'
export { useFrameStore } from './frame.store'
export { ProjectWorkspace } from './ProjectWorkspace'
export { SidePanel } from './side-panel/SidePanel'
export { SidePanelSection } from './side-panel/SidePanelSection'
export { surfaceClassName } from './surface.config'
export { PageCrumb } from './top-bar/PageCrumb'
export { TopBar } from './top-bar/TopBar'
export { Workbench } from './Workbench'
