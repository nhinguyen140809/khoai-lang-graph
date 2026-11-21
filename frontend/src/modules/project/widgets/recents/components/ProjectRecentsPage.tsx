'use client'

import { PlusIcon } from 'lucide-react'
import { useId, useState } from 'react'

import { type ProjectStatus, projectStatusLabels } from '@/modules/project/entities'
import { createProjectMessages, useOpenProjectPrompt } from '@/modules/project/features/create'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useWording } from '@/shared/lib/view'

import { projectRecentsMessages } from '../project-recents.constants'
import { ProjectList } from './ProjectRecentsList'
import { ProjectSearch } from './ProjectSearch'

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
