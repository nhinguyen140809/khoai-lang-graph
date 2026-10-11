import Link from 'next/link'

import { ActivityBar } from '@/components/layout/ActivityBar'
import { AppFrame } from '@/components/layout/AppFrame'
import { FeatureCommands } from '@/components/layout/FeatureCommands'
import { surfaceClassName } from '@/components/layout/surface.config'
import { TopBar } from '@/components/layout/TopBar'
import { NotFoundState } from '@/components/state'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/features/account'
import {
  NewProjectDialog,
  PendingReviewBadge,
  ProjectCommands,
  ProjectGate,
  ProjectSwitcher,
} from '@/features/projects'
import { ThemeSync } from '@/features/settings'
import { ProjectRunStatus } from '@/features/threads'
import { cn } from '@/lib/utils'

/**
 * Every screen of a project: the frame with the features of the project on the activity bar and
 * the run of the project on the status bar. The frame is shared layout, so the feature
 * components it shows are passed in from here.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  const topBar = <TopBar crumb={<ProjectSwitcher projectId={projectId} />} />
  const dialogs = <NewProjectDialog />

  return (
    <>
      <ThemeSync />
      <ProjectGate
        projectId={projectId}
        notFound={
          <AppFrame
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
          </AppFrame>
        }
      >
        <AppFrame
          topBar={topBar}
          activityBar={
            <ActivityBar
              projectId={projectId}
              user={<UserMenu />}
              badges={{ console: <PendingReviewBadge projectId={projectId} /> }}
            />
          }
          sidePanel
          status={<ProjectRunStatus projectId={projectId} />}
          commands={
            <>
              <FeatureCommands projectId={projectId} />
              <ProjectCommands currentProjectId={projectId} />
            </>
          }
          dialogs={dialogs}
        >
          {children}
        </AppFrame>
      </ProjectGate>
    </>
  )
}
