import { ProjectGate, ProjectNotFound } from '@/modules/project/entities'
import { ProjectCommands } from '@/modules/project/widgets/commands'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { ProjectSwitcher } from '@/modules/project/widgets/menu'
import { ProjectRunStatusItem } from '@/modules/project/widgets/status'
import { AccountMenuItem } from '@/modules/user/widgets/menu'
import { TabbedWorkspace, UntabbedWorkspace, Workbench } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

/**
 * Every screen of a project: the frame with the menu of the project on the top bar, its dialogs
 * and the account menu, and the project workspace with the editor. A project that does not exist
 * shows as not found, in the frame of the screens outside a project. The features of a project join
 * the activity bar as they are built.
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
          homeHref={routes.home()}
          contributions={
            <>
              <ProjectCommands />
              <AccountMenuItem />
            </>
          }
        >
          <UntabbedWorkspace>
            <ProjectNotFound projectId={projectId} />
          </UntabbedWorkspace>
        </Workbench>
      }
    >
      <Workbench
        crumb={crumb}
        homeHref={routes.home()}
        contributions={
          <>
            <ProjectCommands currentProjectId={projectId} />
            <ProjectDialogs />
            <ProjectRunStatusItem projectId={projectId} />
            <AccountMenuItem />
          </>
        }
      >
        <TabbedWorkspace tabGroup={projectId}>{children}</TabbedWorkspace>
      </Workbench>
    </ProjectGate>
  )
}
