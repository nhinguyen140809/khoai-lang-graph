import { AccountMenuItem } from '@/features/account'
import {
  ProjectCommands,
  ProjectDialogs,
  ProjectGate,
  ProjectNotFound,
  ProjectSwitcher,
} from '@/features/projects'
import { PageWorkspace, ProjectWorkspace, Workbench } from '@/shared/components/frame'

/**
 * Every screen of a project: the frame with the menu of the project on the top bar, its dialogs
 * and the account menu, and the project workspace with the editor. A project that does not exist shows as not found, in the frame of the
 * screens outside a project. The features of a project join the activity bar as they are built.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  const crumb = <ProjectSwitcher projectId={projectId} />

  return (
    <ProjectGate
      projectId={projectId}
      notFound={
        <Workbench
          crumb={crumb}
          contributions={
            <>
              <ProjectCommands />
              <AccountMenuItem />
            </>
          }
        >
          <PageWorkspace>
            <ProjectNotFound projectId={projectId} />
          </PageWorkspace>
        </Workbench>
      }
    >
      <Workbench
        crumb={crumb}
        contributions={
          <>
            <ProjectCommands currentProjectId={projectId} />
            <ProjectDialogs />
            <AccountMenuItem />
          </>
        }
      >
        <ProjectWorkspace projectId={projectId}>{children}</ProjectWorkspace>
      </Workbench>
    </ProjectGate>
  )
}
