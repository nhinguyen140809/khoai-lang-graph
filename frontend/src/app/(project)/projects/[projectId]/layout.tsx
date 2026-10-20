import { ProjectGate, ProjectNotFound } from '@/modules/project/entities'
import { ProjectCommands } from '@/modules/project/widgets/commands'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { ProjectSwitcher } from '@/modules/project/widgets/menu'
import { ProjectRunStatusItem } from '@/modules/project/widgets/status'
import { MonthlyBudgetItem } from '@/modules/usage/entities'
import { AccountMenuItem } from '@/modules/user/widgets/menu'
import { PageWorkspace, Workbench,Workspace } from '@/shared/components/frame'
import { routes } from '@/shared/config/routes'

/**
 * Every screen of a project: the frame with the menu of the project on the top bar, its dialogs,
 * its status on the status bar, the account menu and the budget of the month, and the project
 * workspace with the editor. A project that does not exist shows as not found, in the frame of the
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
          homeHref={routes.home()}
          contributions={
            <>
              <ProjectCommands />
              <AccountMenuItem />
              <MonthlyBudgetItem />
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
        homeHref={routes.home()}
        contributions={
          <>
            <ProjectCommands currentProjectId={projectId} />
            <ProjectDialogs />
            <ProjectRunStatusItem projectId={projectId} />
            <AccountMenuItem />
            <MonthlyBudgetItem />
          </>
        }
      >
        <Workspace tabGroup={projectId}>{children}</Workspace>
      </Workbench>
    </ProjectGate>
  )
}
