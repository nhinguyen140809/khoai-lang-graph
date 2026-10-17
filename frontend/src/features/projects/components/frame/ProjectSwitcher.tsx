'use client'

import {
  CheckIcon,
  ChevronDownIcon,
  LayoutListIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
} from 'lucide-react'
import Link from 'next/link'

import { isNotFoundError } from '@/shared/api/api-error.utils'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'

import { projectMessages } from '../../constants/projects.constants'
import { useOpenProjectDialog } from '../../hooks/useOpenProjectDialog'
import { useOpenProjectPrompt } from '../../hooks/useOpenProjectPrompt'
import { useProject, useRecentProjects } from '../../hooks/useProjectQueries'
import { projectName } from '../../projects.utils'

interface ProjectSwitcherProps {
  projectId: string
}

/**
 * The name of the open project in the top bar, with a menu to switch to a recent project, and last
 * to rename the open one, in the dialog of `ProjectDialogs`. A project that fails to load again
 * keeps the name it had.
 */
export function ProjectSwitcher({ projectId }: ProjectSwitcherProps) {
  const project = useProject(projectId)
  const openProjectPrompt = useOpenProjectPrompt()
  const openDialog = useOpenProjectDialog()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="min-w-0 px-1.5 text-sm font-bold">
          <OpenProjectName projectId={projectId} />
          <ChevronDownIcon aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {project.isError && (
          <>
            <DropdownMenuItem variant="destructive" onSelect={() => void project.refetch()}>
              <RotateCcwIcon aria-hidden />
              Load the project again
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Switch project</DropdownMenuLabel>
        <RecentProjectItems openId={projectId} />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={routes.projects()}>
            <LayoutListIcon aria-hidden />
            {projectMessages.all}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            openProjectPrompt()
          }}
        >
          <PlusIcon aria-hidden />
          {projectMessages.create}
        </DropdownMenuItem>
        {project.data !== undefined && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                openDialog('rename', projectId)
              }}
            >
              <PencilIcon aria-hidden />
              {projectMessages.rename}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The name of the open project, while it loads, or why it does not show. */
function OpenProjectName({ projectId }: ProjectSwitcherProps) {
  const project = useProject(projectId)

  if (project.data !== undefined) {
    return <span className="truncate">{projectName(project.data)}</span>
  }
  if (project.isPending) {
    return (
      <>
        <Skeleton className="h-3.5 w-24" />
        <span className="sr-only">Loading the project</span>
      </>
    )
  }
  return (
    <span className="truncate text-destructive">
      {isNotFoundError(project.error) ? projectMessages.notFound : projectMessages.unavailable}
    </span>
  )
}

/**
 * The recent projects to switch to, the open one marked. Those already shown stay when loading them
 * again fails.
 */
function RecentProjectItems({ openId }: { openId: string }) {
  const projects = useRecentProjects()

  if (projects.isPending) {
    return <DropdownMenuItem disabled>{projectMessages.listLoading}</DropdownMenuItem>
  }

  const retry = (
    <DropdownMenuItem variant="destructive" onSelect={() => void projects.refetch()}>
      <RotateCcwIcon aria-hidden />
      {projectMessages.listFailed}
    </DropdownMenuItem>
  )
  if (projects.isLoadingError) return retry

  // Loading them again failed: the projects shown stay, under the item that loads them again.
  const failedAgain = projects.isRefetchError && retry
  if (projects.data.length === 0) {
    return (
      <>
        {failedAgain}
        <DropdownMenuItem disabled>{projectMessages.none}</DropdownMenuItem>
      </>
    )
  }

  return (
    <>
      {failedAgain}
      {projects.data.map((item) => (
        <DropdownMenuItem key={item.id} asChild>
          <Link href={routes.project(item.id).activity()}>
            <CheckIcon aria-hidden className={cn(item.id !== openId && 'invisible')} />
            <span className="truncate">{projectName(item)}</span>
            {item.id === openId && <span className="sr-only">, open</span>}
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  )
}
