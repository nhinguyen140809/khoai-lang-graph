'use client'

import { FolderIcon, LayoutListIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useCommandPaletteStore } from '@/components/layout'
import { CommandGroup, CommandItem } from '@/components/ui/command'

import { useProjects } from '../hooks/useProjects'
import { useNewProjectDialogStore } from '../new-project.store'

interface ProjectCommandsProps {
  /** The open project, left out of the projects to open. */
  currentProjectId?: string
}

/** Commands of the command palette that open a project or create one. */
export function ProjectCommands({ currentProjectId }: ProjectCommandsProps) {
  const router = useRouter()
  const projects = useProjects('active')
  const setPaletteOpen = useCommandPaletteStore((state) => state.setOpen)
  const openNewProject = useNewProjectDialogStore((state) => state.setOpen)

  return (
    <CommandGroup heading="Projects">
      {projects.isPending && <CommandItem disabled>Loading projects...</CommandItem>}
      {projects.isError && (
        <CommandItem onSelect={() => void projects.refetch()}>
          <RotateCcwIcon aria-hidden />
          Failed to load projects. Try again
        </CommandItem>
      )}
      {projects.data
        ?.filter(({ id }) => id !== currentProjectId)
        .map(({ id, name }) => (
          <CommandItem
            key={id}
            // The id keeps the value unique when two projects share a name.
            value={`Open project ${name} ${id}`}
            onSelect={() => {
              setPaletteOpen(false)
              router.push(`/projects/${encodeURIComponent(id)}/console`)
            }}
          >
            <FolderIcon aria-hidden />
            Open {name}
          </CommandItem>
        ))}
      <CommandItem
        value="All projects"
        onSelect={() => {
          setPaletteOpen(false)
          router.push('/projects')
        }}
      >
        <LayoutListIcon aria-hidden />
        All projects
      </CommandItem>
      <CommandItem
        value="New project"
        onSelect={() => {
          setPaletteOpen(false)
          openNewProject(true)
        }}
      >
        <PlusIcon aria-hidden />
        New project
      </CommandItem>
    </CommandGroup>
  )
}
