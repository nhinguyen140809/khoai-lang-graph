import { ChatSettingsBarItem } from '@/modules/activity/widgets/chat'
import { ActivityDialogs } from '@/modules/activity/widgets/dialogs'
import { ExportProjectButton } from '@/modules/artifact/features/export'
import { ExportDialogs } from '@/modules/artifact/widgets/export'
import { DocumentsTool } from '@/modules/documents/widgets/reader'
import { ProjectGate, ProjectNotFound } from '@/modules/project/entities'
import { ProjectCommands } from '@/modules/project/widgets/commands'
import { ProjectHeading } from '@/modules/project/widgets/heading'
import { DeskBarItem, DeskBarSide } from '@/shared/components/frame'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a page that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block.
export const instant = false

// The palette is the search of the user view, so it offers more projects than the menus of the
// developer view do.
const deskPaletteProjectCount = 30

/**
 * The pages of a project: in the bar of the desk, the name of the project and its menu at the
 * left, and at the right the export, then at the very end the settings of the chat; the documents, which open in the reader, are a tool of the
 * desk, which shows it in its bar or its rail as its arrangement says; then the page, with the
 * dialogs of the chat and of the export. A project that does not exist shows as not found, with
 * no item in the bar.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/user/projects/[projectId]'>) {
  const { projectId } = await params

  return (
    <ProjectGate projectId={projectId} notFound={<ProjectNotFound projectId={projectId} />}>
      <ProjectCommands currentProjectId={projectId} count={deskPaletteProjectCount} />
      <DeskBarItem side={DeskBarSide.Left}>
        <ProjectHeading projectId={projectId} />
      </DeskBarItem>
      <DocumentsTool />
      <DeskBarItem side={DeskBarSide.Right}>
        <ExportProjectButton />
      </DeskBarItem>
      <ChatSettingsBarItem projectId={projectId} />
      {children}
      <ActivityDialogs />
      <ExportDialogs projectId={projectId} />
    </ProjectGate>
  )
}
