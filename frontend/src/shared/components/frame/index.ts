// The frame of every screen. Code outside this folder imports it from here, so the files can move
// between its folders; files inside the folder import each other with relative paths. The index
// gives components, hooks and types; the stores stay inside the frame, behind its hooks. Server
// Components import the index too, so every hook it gives starts with 'use client'.
export { LogoMark } from './bars/components/LogoMark'
export { PageCrumb } from './bars/components/PageCrumb'
export { useStatusBarItem } from './bars/hooks/useStatusBarItem'
export { StatusBarSide } from './bars/status-bar.constants'
export type { StatusBarItem } from './bars/status-bar.types'
export { PaletteGroup } from './commands/command.constants'
export type { PaletteCommand } from './commands/command.types'
export { useCommands } from './commands/hooks/useCommands'
export type {
  ActivityBarItem,
  Destination,
  FeatureDestination,
  PlannedDestination,
  TabIcons,
} from './destinations/destination.types'
export { useActivityBarItem } from './destinations/hooks/useActivityBarItem'
export { useOpenPage } from './hooks/useOpenPage'
export { AuthScreen } from './layouts/components/AuthScreen'
export { PageWorkspace } from './layouts/components/PageWorkspace'
export { Workbench } from './layouts/components/Workbench'
export { Workspace } from './layouts/components/Workspace'
export {
  type BottomPanelSection,
  BottomPanelSections,
} from './panels/components/BottomPanelSections'
export { EditorWithBottomPanel } from './panels/components/EditorWithBottomPanel'
export { SidePanel } from './panels/components/SidePanel'
export { SidePanelSection } from './panels/components/SidePanelSection'
export { useEditorTab } from './tabs/hooks/useEditorTab'
