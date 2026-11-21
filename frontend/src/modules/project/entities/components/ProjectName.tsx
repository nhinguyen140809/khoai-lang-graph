'use client'

import { isNotFoundError } from '@/shared/api/error'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { useProject } from '../projects/hooks/useProjectQueries'
import { projectMessages } from '../projects/projects.constants'
import { projectName } from '../projects/projects.utils'

/**
 * The name of a project by its id, for a button or a bar that shows the open project: its name, whole in a
 * tooltip, a placeholder while it loads, or why it does not show. A project that fails to load again keeps
 * the name it had.
 */
export function ProjectName({ projectId }: { projectId: string }) {
  const project = useProject(projectId)

  if (project.data !== undefined) {
    const name = projectName(project.data)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="truncate">{name}</span>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    )
  }
  if (project.isPending) {
    return (
      <>
        <Skeleton className="h-3.5 w-24" />
        <span className="sr-only">{projectMessages.loading}</span>
      </>
    )
  }
  return (
    <span className="truncate text-destructive">
      {isNotFoundError(project.error) ? projectMessages.notFound : projectMessages.unavailable}
    </span>
  )
}
