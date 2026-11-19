// The frames of the screens: the workbench of the developer view, and the desk of the user view
// (`Desk`, the items of its bar and the parts of its side list). Code outside this folder
// imports them from here, so the files can move between its folders; files inside the folder
// import each other with relative paths. The index gives components, hooks and types; the stores
// stay inside the frame, behind its hooks. Server Components import the index too, so every hook
// it gives starts with 'use client'. The folder names no object of the product: the modules fill it.
export { DeskBarItem } from './bars/components/DeskBarItem'
export { PageCrumb } from './bars/components/PageCrumb'
export { DeskBarSide } from './bars/desk-bar.types'
export { useDeskBarItem } from './bars/hooks/useDeskBarItem'
export { useStatusBarItem } from './bars/hooks/useStatusBarItem'
export { type StatusBarItem, StatusBarSide } from './bars/status-bar.types'
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
export { Desk } from './layouts/components/Desk'
export { PageColumn } from './layouts/components/PageColumn'
export { TabbedWorkspace } from './layouts/components/TabbedWorkspace'
export { UntabbedWorkspace } from './layouts/components/UntabbedWorkspace'
export { Workbench } from './layouts/components/Workbench'
export { BottomPanelSections } from './panels/components/BottomPanelSections'
export { EditorWithBottomPanel } from './panels/components/EditorWithBottomPanel'
export { SidePanel } from './panels/components/SidePanel'
export { SidePanelSection } from './panels/components/SidePanelSection'
export type { BottomPanelSection } from './panels/panel.types'
export { SidebarActionItem } from './sidebar/components/SidebarActionItem'
export { SidebarItemMenu, SidebarLinkItem } from './sidebar/components/SidebarLinkItem'
export { SidebarNote, SidebarRetryItem } from './sidebar/components/SidebarListStates'
export { SidebarSearch } from './sidebar/components/SidebarSearch'
export { SidebarSection, SidebarSectionAction } from './sidebar/components/SidebarSection'
export { useSidebarLayout } from './sidebar/hooks/useSidebarLayout'
export type { SidebarLayout } from './sidebar/sidebar.types'
export { PageLink } from './tabs/components/PageLink'
export { useEditorTab } from './tabs/hooks/useEditorTab'
export { useTabIcon } from './tabs/hooks/useTabIcon'
export { useTabIcons } from './tabs/hooks/useTabIcons'
