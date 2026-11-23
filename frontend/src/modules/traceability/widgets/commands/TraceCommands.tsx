'use client'

import { WaypointsIcon } from 'lucide-react'

import { useOpenPage } from '@/shared/components/frame'
import { useCommands } from '@/shared/lib/commands'
import { routes } from '@/shared/routes'

import { traceCommandsMessages } from './trace-commands.constants'

const GROUP = 'Trace'

/**
 * Registers the commands of Trace: the one that shows its start page, and the one that shows the
 * open issues of the project. A command that links two items needs the item it starts from,
 * which the palette cannot know, so the pages and menus hold that action instead.
 * @view developer
 */
export function TraceCommands({ projectId }: { projectId: string }) {
  const openPage = useOpenPage()
  const project = routes.project(projectId)

  useCommands([
    {
      id: 'trace.issues',
      label: traceCommandsMessages.issues,
      group: GROUP,
      icon: <WaypointsIcon aria-hidden />,
      run: () => {
        openPage(project.traceIssues())
      },
    },
    {
      id: 'trace.home',
      label: traceCommandsMessages.home,
      group: GROUP,
      icon: <WaypointsIcon aria-hidden />,
      run: () => {
        openPage(project.trace())
      },
    },
  ])
  return null
}
