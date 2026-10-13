'use client'

import { ArchiveIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Toggle } from '@/shared/ui/toggle'

import { useNewProjectDialogStore } from '../new-project.store'
import type { ProjectStatus } from '../projects.types'
import { ProjectTable } from './ProjectTable'

/** The projects of the user, outside a project. A row opens the project. */
export function ProjectListPage() {
  const [status, setStatus] = useState<ProjectStatus>('active')
  const openNewProject = useNewProjectDialogStore((state) => state.setOpen)

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">Projects</h1>
          <div className="ml-auto flex items-center gap-2">
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
            <Button
              onClick={() => {
                openNewProject(true)
              }}
            >
              <PlusIcon aria-hidden />
              New project
            </Button>
          </div>
        </div>
        <ProjectTable status={status} />
      </div>
    </ScrollArea>
  )
}
