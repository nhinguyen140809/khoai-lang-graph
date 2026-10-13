'use client'

import { ArchiveIcon, FolderIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { consoleHref } from '@/shared/config/routes.utils'
import { useNow } from '@/shared/hooks/useNow'
import { formatRelativeTime } from '@/shared/lib/relative-time.utils'

import { useProjects } from '../hooks/useProjects'
import { useNewProjectDialogStore } from '../new-project.store'
import type { ProjectStatus } from '../projects.types'
import { ProjectRunCell } from './ProjectRunCell'

interface ProjectTableProps {
  status: ProjectStatus
}

export function ProjectTable({ status }: ProjectTableProps) {
  const projects = useProjects(status)
  const openNewProject = useNewProjectDialogStore((state) => state.setOpen)
  const now = useNow()

  if (projects.isPending) {
    return <LoadingState label="Loading projects" rows={4} className="px-0" />
  }

  if (projects.isError) {
    return (
      <ErrorState
        message={projects.error.message}
        onRetry={() => void projects.refetch()}
        className="px-0"
      />
    )
  }

  if (projects.data.length === 0) {
    return status === 'archived' ? (
      <EmptyState
        icon={ArchiveIcon}
        title="No archived projects"
        description="A project that is archived is listed here."
      />
    ) : (
      <EmptyState
        icon={FolderIcon}
        title="No projects yet"
        description="A project holds the requirements of one product. After creating it, describe the product in the console to start the first run."
        action={
          <Button
            onClick={() => {
              openNewProject(true)
            }}
          >
            <PlusIcon aria-hidden />
            New project
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableCaption className="sr-only">
          {status === 'archived' ? 'Archived projects' : 'Projects'}
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Last activity</TableHead>
            <TableHead>Run</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.data.map((project) => (
            <TableRow key={project.id} className="relative">
              <TableCell className="font-medium">
                {/* The link covers the row, so that the whole row opens the project. */}
                <Link
                  href={consoleHref(project.id)}
                  className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                >
                  {project.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <time dateTime={project.last_activity_at}>
                  {formatRelativeTime(project.last_activity_at, now)}
                </time>
              </TableCell>
              <TableCell>
                <ProjectRunCell counts={project.unfinished_run_counts} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
