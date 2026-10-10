'use client'

import { CheckIcon, ChevronDownIcon, LayoutListIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { isNotFoundError } from '@/lib/api-fetch.utils'
import { cn } from '@/lib/utils'

import { useProject } from '../hooks/useProject'
import { useProjects } from '../hooks/useProjects'
import { useNewProjectDialogStore } from '../new-project.store'

interface ProjectSwitcherProps {
  projectId: string
}

/** The name of the open project in the top bar, with a menu to switch project. */
export function ProjectSwitcher({ projectId }: ProjectSwitcherProps) {
  const project = useProject(projectId)
  const projects = useProjects('active')
  const openNewProject = useNewProjectDialogStore((state) => state.setOpen)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="min-w-0 px-1.5 text-xs font-medium">
          {project.isPending ? (
            <>
              <Skeleton className="h-3.5 w-24" />
              <span className="sr-only">Loading the project</span>
            </>
          ) : (
            <span className={cn('truncate', project.isError && 'text-destructive')}>
              {project.isSuccess
                ? project.data.name
                : isNotFoundError(project.error)
                  ? 'Project not found'
                  : 'Project unavailable'}
            </span>
          )}
          <ChevronDownIcon aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {project.isError && (
          <>
            <DropdownMenuItem onSelect={() => void project.refetch()}>
              <RotateCcwIcon aria-hidden />
              Load the project again
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Switch project</DropdownMenuLabel>
        {projects.isPending && <DropdownMenuItem disabled>Loading projects...</DropdownMenuItem>}
        {projects.isError && (
          <DropdownMenuItem onSelect={() => void projects.refetch()}>
            <RotateCcwIcon aria-hidden />
            Failed to load projects. Try again
          </DropdownMenuItem>
        )}
        {projects.data?.length === 0 && <DropdownMenuItem disabled>No projects</DropdownMenuItem>}
        {projects.data?.map(({ id, name }) => (
          <DropdownMenuItem key={id} asChild>
            <Link href={`/projects/${encodeURIComponent(id)}/chat`}>
              <CheckIcon aria-hidden className={cn(id !== projectId && 'invisible')} />
              <span className="truncate">{name}</span>
              {id === projectId && <span className="sr-only">(open)</span>}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects">
            <LayoutListIcon aria-hidden />
            All projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            openNewProject(true)
          }}
        >
          <PlusIcon aria-hidden />
          New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
