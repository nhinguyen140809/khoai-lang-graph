'use client'

import { MoreHorizontalIcon } from 'lucide-react'
import Link from 'next/link'

import {
  emptyProjectListMessage,
  type Project,
  ProjectActionItems,
  projectActionMessages,
  projectMessages,
  projectName,
  type ProjectStatus,
  useProjectPages,
  useProjectSearch,
} from '@/modules/project/entities'
import { useArchiveProject } from '@/modules/project/features/archive'
import { useOpenDeleteProjectDialog } from '@/modules/project/features/delete'
import { useOpenRenameProjectDialog } from '@/modules/project/features/rename'
import { RunStatusBadge } from '@/modules/run/entities'
import { errorMessageOf } from '@/shared/api/error'
import { Menu, MenuContent, MenuTrigger } from '@/shared/components/menu'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/shared/components/ui/item'
import { formatRelativeTime, useNow } from '@/shared/lib/time'

import { projectRecentsMessages } from '../project-recents.constants'

/** The projects of one tab that match the search, a page at a time, or the state of their load. */
export function ProjectList({ status, search }: { status: ProjectStatus; search: string }) {
  const { projects, matching } = useProjectSearch(status, search)

  if (projects.isPending) {
    return <LoadingState layout="list" rows={4} label={projectMessages.listLoading} />
  }
  // A page after the first that fails keeps the projects already shown.
  if (projects.data === undefined) {
    return (
      <ErrorState
        message={errorMessageOf(projects.error)}
        onRetry={() => void projects.refetch()}
        className="px-0"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {matching.length === 0 ? (
        <EmptyState
          size="compact"
          title={emptyProjectListMessage(status, search)}
          className="px-0"
        />
      ) : (
        // The rows keep their padding for the hover, and their text in line with the title.
        <ItemGroup className="-mx-3 gap-1">
          {matching.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </ItemGroup>
      )}
      {projects.hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={projects.isFetchingNextPage}
          onClick={() => void projects.fetchNextPage()}
        >
          {projectRecentsMessages.more}
        </Button>
      )}
    </div>
  )
}

/**
 * One project: its name, a link to its chat that covers the row, the time of its latest activity,
 * the status of its runs, and the menu of its actions.
 */
function ProjectRow({ project }: { project: Project }) {
  const pages = useProjectPages()
  const now = useNow()

  return (
    <Item role="listitem" className="relative hover:bg-muted">
      <ItemContent>
        <ItemTitle>
          <Link
            href={pages.project(project.id)}
            className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring/50"
          >
            {projectName(project)}
          </Link>
        </ItemTitle>
        <ItemDescription>
          <time dateTime={project.last_activity_at}>
            {formatRelativeTime(project.last_activity_at, now)}
          </time>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <RunStatusBadge status={project.rollup_run_status} />
        <ProjectRowMenu project={project} />
      </ItemActions>
    </Item>
  )
}

/**
 * The menu of a project of the page: Rename, Archive or Restore, then Delete, which asks first.
 * Rename and Delete open the dialogs of `ProjectDialogs`. The button always shows, also on a screen
 * without a pointer to hover the row.
 */
function ProjectRowMenu({ project }: { project: Project }) {
  const { archive, restore } = useArchiveProject()
  const openRename = useOpenRenameProjectDialog()
  const openDelete = useOpenDeleteProjectDialog()

  return (
    <Menu>
      <MenuTrigger>
        {/* Positioned, so that it lies over the link that covers the row. */}
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
          <MoreHorizontalIcon aria-hidden />
          <span className="sr-only">{projectActionMessages.menu(projectName(project))}</span>
        </Button>
      </MenuTrigger>
      <MenuContent
        title={projectActionMessages.menu(projectName(project))}
        align="end"
        className="w-40"
      >
        <ProjectActionItems
          project={project}
          onRename={() => {
            openRename(project.id)
          }}
          onArchive={() => {
            archive(project)
          }}
          onRestore={() => {
            restore(project)
          }}
          onDelete={() => {
            openDelete(project.id)
          }}
        />
      </MenuContent>
    </Menu>
  )
}
