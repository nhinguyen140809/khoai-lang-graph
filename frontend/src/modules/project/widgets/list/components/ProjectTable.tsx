'use client'

import { FolderOpenIcon, FunnelXIcon } from 'lucide-react'
import Link from 'next/link'

import {
  type ProjectFilters,
  projectMessages,
  projectName,
  type ProjectStatus,
  useProjectList,
} from '@/modules/project/entities'
import { filterMessages } from '@/shared/components/filter'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { PendingButton } from '@/shared/components/ui/pending-button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { routes } from '@/shared/config/routes'
import { useNow } from '@/shared/hooks/useNow'
import { formatRelativeTime } from '@/shared/lib/formatters/time.utils'

import { projectFilterMessages } from '../project-filters.constants'
import { isFiltered } from '../project-filters.utils'
import { ProjectActionsMenu } from './ProjectActionsMenu'
import { ProjectRunCell } from './ProjectRunCell'

interface ProjectTableProps {
  status: ProjectStatus
  filters: ProjectFilters
  /** Clears the filters, from the sentence that says that no project matches them. */
  onClearFilters: () => void
}

/**
 * The projects with one status, narrowed by the filters, a page at a time; a row opens its project,
 * and its menu archives, restores or deletes it.
 */
export function ProjectTable({ status, filters, onClearFilters }: ProjectTableProps) {
  const projects = useProjectList(status, filters)
  const now = useNow()

  if (projects.isPending) {
    return <LoadingState label={projectMessages.listLoading} rows={4} columns={3} />
  }

  // A page after the first that fails keeps the rows already shown.
  if (projects.data === undefined) {
    return (
      <ErrorState
        message={projects.error.message}
        onRetry={() => void projects.refetch()}
        className="px-0"
      />
    )
  }

  const rows = projects.data.pages.flatMap(({ items }) => items)

  // Filters that keep nothing show the whole empty state, with the way back to every project; a
  // first visit has nothing else to do here either. The archived projects are a part of the list,
  // where one sentence says enough.
  if (rows.length === 0 && isFiltered(filters)) {
    return (
      <EmptyState
        icon={FunnelXIcon}
        title={projectFilterMessages.noMatch}
        description={projectFilterMessages.noMatchHint}
        action={
          <Button variant="outline" onClick={onClearFilters}>
            {filterMessages.clear}
          </Button>
        }
      />
    )
  }
  if (rows.length === 0) {
    return status === 'archived' ? (
      <EmptyState size="compact" title="No archived projects." className="px-0" />
    ) : (
      <EmptyState
        icon={FolderOpenIcon}
        title="No projects yet"
        description="Describe an idea above to create your first project."
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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last activity</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((project) => (
            <TableRow key={project.id} className="relative">
              <TableCell className="font-medium text-primary">
                {/* The link covers the row, so that the whole row opens the project. */}
                <Link
                  href={routes.project(project.id).activity()}
                  className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                >
                  {projectName(project)}
                </Link>
              </TableCell>
              <TableCell>
                <ProjectRunCell project={project} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                <time dateTime={project.last_activity_at}>
                  {formatRelativeTime(project.last_activity_at, now)}
                </time>
              </TableCell>
              <TableCell className="text-right">
                <ProjectActionsMenu project={project} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {projects.hasNextPage && (
        <div className="flex flex-col items-center gap-2">
          {/* The button tries the page again. */}
          {projects.isFetchNextPageError && (
            <ErrorState size="compact" message={projects.error.message} className="p-0" />
          )}
          <PendingButton
            variant="outline"
            pending={projects.isFetchingNextPage}
            pendingLabel="Loading more projects"
            onClick={() => void projects.fetchNextPage()}
          >
            Show more projects
          </PendingButton>
        </div>
      )}
    </div>
  )
}
