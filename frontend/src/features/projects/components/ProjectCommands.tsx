'use client'

import { FolderIcon, LayoutListIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { type PaletteCommand, useCommands } from '@/components/layout'
import { consoleHref } from '@/lib/routes.utils'

import { useProjects } from '../hooks/useProjects'
import { useNewProjectDialogStore } from '../new-project.store'

interface ProjectCommandsProps {
  /** The open project, left out of the projects to open. */
  currentProjectId?: string
}

const GROUP = 'Projects'

/** Registers the commands that open a project or create one. Renders nothing. */
export function ProjectCommands({ currentProjectId }: ProjectCommandsProps) {
  const router = useRouter()
  const projects = useProjects('active')
  const openNewProject = useNewProjectDialogStore((state) => state.setOpen)
  const commands: PaletteCommand[] = []

  if (projects.isPending) {
    commands.push({ id: 'projects.loading', label: 'Loading projects...', group: GROUP })
  }
  if (projects.isError) {
    commands.push({
      id: 'projects.retry',
      label: 'Failed to load projects. Try again',
      group: GROUP,
      icon: <RotateCcwIcon />,
      run: () => void projects.refetch(),
    })
  }
  for (const { id, name } of projects.data ?? []) {
    if (id === currentProjectId) continue
    commands.push({
      id: `projects.open.${id}`,
      label: `Open ${name}`,
      group: GROUP,
      icon: <FolderIcon />,
      run: () => {
        router.push(consoleHref(id))
      },
    })
  }
  commands.push(
    {
      id: 'projects.all',
      label: 'All projects',
      group: GROUP,
      icon: <LayoutListIcon />,
      run: () => {
        router.push('/projects')
      },
    },
    {
      id: 'projects.new',
      label: 'New project',
      group: GROUP,
      icon: <PlusIcon />,
      run: () => {
        openNewProject(true)
      },
    },
  )

  useCommands(commands)

  return null
}
