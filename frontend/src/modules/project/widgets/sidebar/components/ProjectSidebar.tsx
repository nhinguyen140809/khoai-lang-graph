'use client'

import { ListFilterIcon, PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  type Project,
  ProjectActionItems,
  projectActionMessages,
  type ProjectFilters,
  projectFiltersOf,
  projectMessages,
  useProjectFilterFields,
} from '@/modules/project/entities'
import { useArchiveProject } from '@/modules/project/features/archive'
import { useOpenProjectPrompt } from '@/modules/project/features/create'
import { useOpenDeleteProjectDialog } from '@/modules/project/features/delete'
import { useRestoreProjectNews } from '@/modules/project/features/news'
import { useOpenRenameProjectDialog } from '@/modules/project/features/rename'
import { FilterDropdown, noFilters, useFilterState } from '@/shared/components/filter'
import {
  SidebarActionItem,
  SidebarItemMenu,
  SidebarLinkItem,
  SidebarNote,
  SidebarRetryItem,
  SidebarSearch,
  SidebarSection,
  SidebarSectionAction,
} from '@/shared/components/frame'
import { LoadingState } from '@/shared/components/state'
import { ColoredText } from '@/shared/components/ui/colored-text'
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
} from '@/shared/components/ui/sidebar'
import { userRoutes } from '@/shared/routes'

import { useProjectRow } from '../hooks/useProjectRow'
import { useRecentSidebarProjects } from '../hooks/useRecentSidebarProjects'
import { projectSidebarMessages } from '../project-sidebar.constants'

interface ProjectSidebarProps {
  /** What closes the side list at its bottom, such as the account menu. */
  footer?: ReactNode
}

/**
 * The side list of the desk, top to bottom: the search, which opens the command palette, and the
 * button that starts a project under it, the section of the projects, then the footer. The section shows the active
 * projects with the latest activity that the filters keep, from the one that needs the user most, and ends with View all, the page of every project, active or archived. A row links to
 * the chat of its project, marks the one on show, shows a mark at the end of its row only when it
 * asks for the user, works or has news, and has a menu that renames, archives, or deletes it in the dialogs of
 * `ProjectDialogs`.
 * @view user
 */
export function ProjectSidebar({ footer }: ProjectSidebarProps) {
  const openProjectPrompt = useOpenProjectPrompt()
  // Local to the side list, which stays on every page: the filters do not go to the address.
  const filterFields = useProjectFilterFields()
  const filterState = useFilterState(noFilters)
  const filters = projectFiltersOf(filterState.values)
  useRestoreProjectNews()

  return (
    <>
      <SidebarHeader className="pt-0">
        <SidebarMenu className="gap-1">
          <SidebarSearch label={projectSidebarMessages.search} />
          <SidebarActionItem
            className="text-foreground"
            label={projectSidebarMessages.create}
            onClick={() => {
              openProjectPrompt()
            }}
          >
            <PlusIcon aria-hidden />
          </SidebarActionItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-4">
        <SidebarSection
          title={projectSidebarMessages.projects}
          action={
            <FilterDropdown
              fields={filterFields}
              values={filterState.values}
              onToggle={filterState.toggle}
              onClear={filterState.clear}
            >
              <SidebarSectionAction label={projectSidebarMessages.filter}>
                <ListFilterIcon aria-hidden />
              </SidebarSectionAction>
            </FilterDropdown>
          }
        >
          <RecentProjects filters={filters} />
          <SidebarMenu className="gap-1">
            <SidebarLinkItem href={userRoutes.recents()} className="text-foreground/60">
              <span>{projectSidebarMessages.viewAll}</span>
            </SidebarLinkItem>
          </SidebarMenu>
        </SidebarSection>
      </SidebarContent>
      {footer !== undefined && (
        <>
          <SidebarSeparator className="data-horizontal:w-auto" />
          <SidebarFooter>{footer}</SidebarFooter>
        </>
      )}
    </>
  )
}

/** The active projects with the latest activity. */
function RecentProjects({ filters }: { filters: ProjectFilters }) {
  const { isPending, shown, retry } = useRecentSidebarProjects(filters)
  return (
    <ProjectRows
      isPending={isPending}
      shown={shown}
      onRetry={retry}
      emptyMessage={projectMessages.none}
    />
  )
}

interface ProjectRowsProps {
  isPending: boolean
  /** The projects to list; undefined when they failed to load. */
  shown: readonly Project[] | undefined
  onRetry: () => void
  /** What the list says when it has no project to show. */
  emptyMessage: string
}

/** The rows of some projects, or the state of their load. */
function ProjectRows({ isPending, shown, onRetry, emptyMessage }: ProjectRowsProps) {
  if (isPending) {
    return <LoadingState size="compact" rows={3} label={projectMessages.listLoading} />
  }
  if (shown === undefined) {
    return <SidebarRetryItem label={projectMessages.listFailed} onRetry={onRetry} />
  }
  if (shown.length === 0) return <SidebarNote>{emptyMessage}</SidebarNote>

  return (
    <SidebarMenu className="gap-1">
      {shown.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </SidebarMenu>
  )
}

/**
 * One project: a link to its chat, its status or its news at the end of the row when it has one,
 * and its menu.
 */
function ProjectRow({ project }: { project: Project }) {
  const row = useProjectRow(project)

  return (
    <SidebarLinkItem
      href={row.href}
      label={row.label}
      tooltip={row.name}
      className="text-foreground"
      badge={
        row.mark === null ? undefined : (
          <ColoredText color={row.mark.tone} className="flex">
            <row.mark.icon className="size-3.5" />
          </ColoredText>
        )
      }
      action={<ProjectRowMenu project={project} name={row.name} />}
    >
      <span>{row.name}</span>
    </SidebarLinkItem>
  )
}

/**
 * The menu of a project of the list: Rename, Archive, then Delete, which asks first. Rename and
 * Delete open the dialogs of `ProjectDialogs`.
 */
function ProjectRowMenu({ project, name }: { project: Project; name: string }) {
  const { archive, restore } = useArchiveProject()
  const openRename = useOpenRenameProjectDialog()
  const openDelete = useOpenDeleteProjectDialog()

  return (
    <SidebarItemMenu label={projectActionMessages.menu(name)}>
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
    </SidebarItemMenu>
  )
}
