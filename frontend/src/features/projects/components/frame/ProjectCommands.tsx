'use client'

import { FolderIcon, LayoutListIcon, PencilIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { type PaletteCommand, useCommands } from '@/shared/components/frame'
import { routes } from '@/shared/config/routes'

import { projectMessages } from '../../constants/projects.constants'
import { useOpenProjectDialog } from '../../hooks/useOpenProjectDialog'
import { useOpenProjectPrompt } from '../../hooks/useOpenProjectPrompt'
import { useProject, useRecentProjects } from '../../hooks/useProjectQueries'
import { projectName } from '../../projects.utils'

interface ProjectCommandsProps {
  /** The open project, left out of the projects to open. */
  currentProjectId?: string
}

const GROUP = 'Projects'

/**
 * Registers the commands that open a recent project or the project list, or start a project, and
 * in a project the command that renames it, in the dialog of `ProjectDialogs`.
 */
export function ProjectCommands({ currentProjectId }: ProjectCommandsProps) {
  const router = useRouter()
  const projects = useRecentProjects()
  const current = useProject(currentProjectId)
  const openProjectPrompt = useOpenProjectPrompt()
  const openDialog = useOpenProjectDialog()
  const commands: PaletteCommand[] = []

  if (projects.isPending) {
    commands.push({ id: 'projects.loading', label: projectMessages.listLoading, group: GROUP })
  }
  if (projects.isError) {
    commands.push({
      id: 'projects.retry',
      label: projectMessages.listFailed,
      group: GROUP,
      icon: <RotateCcwIcon />,
      variant: 'destructive',
      run: () => void projects.refetch(),
    })
  }
  for (const project of projects.data ?? []) {
    const { id } = project
    if (id === currentProjectId) continue
    commands.push({
      id: `projects.open.${id}`,
      label: `Open ${projectName(project)}`,
      group: GROUP,
      icon: <FolderIcon />,
      run: () => {
        router.push(routes.project(id).activity())
      },
    })
  }
  commands.push(
    {
      id: 'projects.all',
      label: projectMessages.all,
      group: GROUP,
      icon: <LayoutListIcon />,
      run: () => {
        router.push(routes.projects())
      },
    },
    {
      id: 'projects.new',
      label: projectMessages.create,
      group: GROUP,
      icon: <PlusIcon />,
      run: () => {
        openProjectPrompt()
      },
    },
  )
  // Last, as in the menu of the open project, once the project has loaded.
  if (current.data !== undefined) {
    const { id } = current.data
    commands.push({
      id: 'projects.rename',
      label: projectMessages.rename,
      group: GROUP,
      icon: <PencilIcon />,
      run: () => {
        openDialog('rename', id)
      },
    })
  }

  useCommands(commands)

  return null
}
