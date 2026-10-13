// The frame of every screen. Code outside this folder imports it from here, so the files can move
// between the region folders; files inside the folder import each other with relative paths.
export type {
  Activity,
  FeatureActivity,
  PlannedActivity,
  TabIcons,
} from './activity-bar/activity.types'
export { useOpenPage } from './activity-bar/hooks/useOpenPage'
export { PaletteGroup } from './command-palette/command.constants'
export type { CommandHotkey, PaletteCommand } from './command-palette/command.types'
export { useCommands } from './command-palette/hooks/useCommands'
export { type BottomPanelSection, BottomPanelSections } from './editor/BottomPanelSections'
export { projectTabGroup, useEditorTabsStore } from './editor/editor-tabs.store'
export { EditorWithBottomPanel } from './editor/EditorWithBottomPanel'
export { useEditorTab } from './editor/hooks/useEditorTab'
export { useFrameStore } from './frame.store'
export { ProjectWorkspace } from './ProjectWorkspace'
export { SidePanel } from './side-panel/SidePanel'
export { SidePanelSection } from './side-panel/SidePanelSection'
export { PageCrumb } from './top-bar/PageCrumb'
export { Workbench } from './Workbench'
