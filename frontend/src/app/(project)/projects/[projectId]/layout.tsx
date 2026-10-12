import { FolderInputIcon } from 'lucide-react'
import Link from 'next/link'

import type { Activity, TabIcons } from '@/components/layout/activity.types'
import { ActivityBar } from '@/components/layout/ActivityBar'
import { ProjectWorkspace } from '@/components/layout/ProjectWorkspace'
import { surfaceClassName } from '@/components/layout/surface.config'
import { TopBar } from '@/components/layout/TopBar'
import { Workbench } from '@/components/layout/Workbench'
import { NotFoundState } from '@/components/state'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/features/account'
import { artifactsActivity, artifactTabIcons } from '@/features/artifacts'
import { consoleActivity, consoleTabIcons } from '@/features/console'
import { projectSettingsActivity, projectSettingsTabIcons } from '@/features/project-settings'
import {
  NewProjectDialog,
  PendingReviewBadge,
  ProjectCommands,
  ProjectGate,
  ProjectSwitcher,
} from '@/features/projects'
import { reviewsPath, reviewTabIcons } from '@/features/review'
import { searchActivity } from '@/features/search'
import { ThemeSync } from '@/features/settings'
import { ProjectRunStatus } from '@/features/threads'
import { traceabilityActivity, traceabilityTabIcons } from '@/features/traceability'
import { workflowActivity, workflowTabIcons } from '@/features/workflow'
import { cn } from '@/lib/utils'

/** The icons that the pages of the features name for their tabs. */
const tabIcons: TabIcons = {
  ...consoleTabIcons,
  ...reviewTabIcons,
  ...artifactTabIcons,
  ...workflowTabIcons,
  ...traceabilityTabIcons,
  ...projectSettingsTabIcons,
}

/**
 * Every screen of a project: the frame with the features of the project on the activity bar and
 * the run of the project on the status bar, and the project workspace with the side panel of the
 * feature chosen and the editor. The frame is shared layout, so the features it shows are passed
 * in from here: each feature describes its item, and this list sets which features a project has
 * and in which order.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  const topBar = <TopBar crumb={<ProjectSwitcher projectId={projectId} />} />
  const dialogs = <NewProjectDialog />
  const activities: Activity[] = [
    {
      ...consoleActivity(projectId),
      // A review is a page of the console: its tab keeps the console as the side panel.
      paths: [reviewsPath(projectId)],
      badge: <PendingReviewBadge projectId={projectId} />,
    },
    searchActivity(projectId),
    artifactsActivity(projectId),
    workflowActivity(projectId),
    traceabilityActivity(projectId),
    {
      id: 'sources',
      label: 'Sources',
      icon: <FolderInputIcon />,
      note: 'Uploaded documents, planned for later',
    },
    projectSettingsActivity(projectId),
  ]

  return (
    <>
      <ThemeSync />
      <ProjectGate
        projectId={projectId}
        notFound={
          <Workbench
            topBar={topBar}
            activityBar={<ActivityBar user={<UserMenu />} />}
            commands={<ProjectCommands />}
            dialogs={dialogs}
          >
            <main className={cn(surfaceClassName, 'flex flex-1 items-center justify-center p-6')}>
              <NotFoundState
                className="w-full max-w-md p-0"
                title="Project not found"
                description="No project exists at this address, or it was deleted."
                reference={projectId}
                action={
                  <Button asChild>
                    <Link href="/projects">All projects</Link>
                  </Button>
                }
              />
            </main>
          </Workbench>
        }
      >
        <Workbench
          topBar={topBar}
          activityBar={<ActivityBar user={<UserMenu />} />}
          activities={activities}
          tabIcons={tabIcons}
          status={<ProjectRunStatus projectId={projectId} />}
          commands={<ProjectCommands currentProjectId={projectId} />}
          dialogs={dialogs}
        >
          <ProjectWorkspace projectId={projectId}>{children}</ProjectWorkspace>
        </Workbench>
      </ProjectGate>
    </>
  )
}
