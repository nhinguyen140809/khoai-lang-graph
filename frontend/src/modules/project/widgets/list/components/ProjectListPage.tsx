'use client'

import { ArchiveIcon } from 'lucide-react'
import { Suspense, useId, useState } from 'react'

import { projectMessages, type ProjectStatus } from '@/modules/project/entities'
import { NewProjectDialog, NewProjectPrompt } from '@/modules/project/features/create'
import { FilterMenu, useFilters } from '@/shared/components/filter'
import { LoadingState } from '@/shared/components/state'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Toggle } from '@/shared/components/ui/toggle'

import { projectFiltersOf } from '../project-filters.utils'
import { useProjectFilterFields } from '../useProjectFilterFields'
import { ProjectTable } from './ProjectTable'

/**
 * The screen outside a project: the prompt that starts a project from an idea, with the dialog that
 * creates it, then the projects of the user. A row opens the project.
 */
export function ProjectListPage() {
  // Kept with the page, so that the dialog does not open again when the page shows again.
  const [newProject, setNewProject] = useState({ open: false, idea: '' })

  return (
    <>
      <ScrollArea className="h-full">
        {/* The prompt keeps its place under the top, whatever the length of the list. */}
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 pt-16 pb-8 sm:pt-prompt-top">
          <NewProjectPrompt
            onStart={(idea) => {
              setNewProject({ open: true, idea })
            }}
          />
          {/* The filters are read from the address, which is known in the browser only. */}
          <Suspense fallback={<ListFallback />}>
            <ProjectsSection />
          </Suspense>
        </div>
      </ScrollArea>
      <NewProjectDialog
        open={newProject.open}
        idea={newProject.idea}
        onOpenChange={(open) => {
          setNewProject((previous) => ({ ...previous, open }))
        }}
      />
    </>
  )
}

/** The projects of the user, which the filters in the address and Archived narrow. */
function ProjectsSection() {
  const headingId = useId()
  const [status, setStatus] = useState<ProjectStatus>('active')
  const filterFields = useProjectFilterFields()
  const filters = useFilters(filterFields)

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 id={headingId} className="text-lg font-semibold">
          Your projects
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <FilterMenu fields={filterFields} values={filters.values} onApply={filters.apply} />
          <Toggle
            variant="outline"
            pressed={status === 'archived'}
            onPressedChange={(pressed) => {
              setStatus(pressed ? 'archived' : 'active')
            }}
          >
            <ArchiveIcon aria-hidden />
            Archived
          </Toggle>
        </div>
      </div>
      <ProjectTable
        status={status}
        filters={projectFiltersOf(filters.values)}
        onClearFilters={filters.clear}
      />
    </section>
  )
}

/** The list while the address is read, before the server render reaches the browser. */
function ListFallback() {
  return <LoadingState label={projectMessages.listLoading} rows={4} columns={3} />
}
