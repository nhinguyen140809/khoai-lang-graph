'use client'

import { MoreHorizontalIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useId, useRef, useState } from 'react'

import {
  emptyProjectListMessage,
  type Project,
  ProjectActionItems,
  projectActionMessages,
  projectMessages,
  projectName,
  type ProjectStatus,
  projectStatusLabels,
  useProjectPages,
  useProjectSearch,
} from '@/modules/project/entities'
import { useArchiveProject } from '@/modules/project/features/archive'
import { createProjectMessages, useOpenProjectPrompt } from '@/modules/project/features/create'
import { useOpenDeleteProjectDialog } from '@/modules/project/features/delete'
import { useOpenRenameProjectDialog } from '@/modules/project/features/rename'
import { RunStatusBadge } from '@/modules/run/entities'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shared/components/ui/input-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/shared/components/ui/item'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { formatRelativeTime, useNow } from '@/shared/lib/time'
import { useWording } from '@/shared/lib/view'

import { projectRecentsMessages } from './project-recents.constants'

/** The tabs of the page, in their order. */
const tabStatuses: readonly ProjectStatus[] = ['active', 'archived']

/**
 * The page of every project of the user on the desk: its title, then the tabs Active
 * and Archived at the left, with the search and the button that starts a project at the right,
 * then the projects of the tab on show that match the search, the latest activity first, a page at
 * a time. A row links to the chat of its project and has the menu of its actions.
 */
export function ProjectRecentsPage() {
  const headingId = useId()
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [search, setSearch] = useState('')
  const openProjectPrompt = useOpenProjectPrompt()

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-8"
    >
      <h1 id={headingId} className="text-xl font-semibold">
        {projectRecentsMessages.title}
      </h1>
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value === 'archived' ? 'archived' : 'active')
        }}
        className="gap-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            {tabStatuses.map((tab) => (
              <StatusTab key={tab} status={tab} />
            ))}
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <ProjectSearch value={search} onValueChange={setSearch} />
            <Button
              size="sm"
              onClick={() => {
                openProjectPrompt()
              }}
            >
              <PlusIcon aria-hidden />
              <span className="max-sm:sr-only">{createProjectMessages.create}</span>
            </Button>
          </div>
        </div>
        {tabStatuses.map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ProjectList status={tab} search={search} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

/** The tab of one status, named as the view on show names it. */
function StatusTab({ status }: { status: ProjectStatus }) {
  return <TabsTrigger value={status}>{useWording(projectStatusLabels[status])}</TabsTrigger>
}

interface ProjectSearchProps {
  value: string
  onValueChange: (value: string) => void
}

/**
 * The search of the page: a button that opens the box and puts the focus in it. The box closes when
 * it loses the focus empty, or with Escape, which empties it too.
 */
function ProjectSearch({ value, onValueChange }: ProjectSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = () => {
    onValueChange('')
    setIsOpen(false)
  }

  if (!isOpen && value === '') {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setIsOpen(true)
          // The box shows in the next frame.
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        <SearchIcon aria-hidden />
        <span className="sr-only">{projectRecentsMessages.search}</span>
      </Button>
    )
  }

  return (
    <InputGroup className="w-56 bg-background max-sm:w-40">
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        aria-label={projectRecentsMessages.search}
        placeholder={projectRecentsMessages.search}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
        }}
        onBlur={() => {
          if (value.trim() === '') close()
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" onClick={close}>
          <XIcon aria-hidden />
          <span className="sr-only">{projectRecentsMessages.clearSearch}</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

/** The projects of one tab that match the search, a page at a time, or the state of their load. */
function ProjectList({ status, search }: { status: ProjectStatus; search: string }) {
  const { projects, matching } = useProjectSearch(status, search)

  if (projects.isPending) {
    return <LoadingState layout="list" rows={4} label={projectMessages.listLoading} />
  }
  // A page after the first that fails keeps the projects already shown.
  if (projects.data === undefined) {
    return (
      <ErrorState
        message={projects.error.message}
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Positioned, so that it lies over the link that covers the row. */}
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
          <MoreHorizontalIcon aria-hidden />
          <span className="sr-only">{projectActionMessages.menu(projectName(project))}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
