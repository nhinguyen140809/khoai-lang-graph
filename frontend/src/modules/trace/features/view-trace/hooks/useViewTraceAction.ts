'use client'

import { WaypointsIcon } from 'lucide-react'

import { useOpenPage } from '@/shared/components/frame'
import type { MenuAction } from '@/shared/components/ui/menu-action'
import { routes } from '@/shared/routes'

import { viewTraceMessages } from '../view-trace.constants'
import type { TracedItem } from '../view-trace.types'

/**
 * The action of viewing the trace of an item of a project, for a menu, a button or a canvas, with
 * one behavior wherever it sits: the trace opens in the preview tab, and no tab that was kept is
 * ever replaced. The tab is named after the item until the page knows its own title. It is never
 * disabled.
 */
export function useViewTraceAction(projectId: string): (item: TracedItem) => MenuAction {
  const openPage = useOpenPage()
  const project = routes.project(projectId)

  return ({ id, title }) => ({
    icon: WaypointsIcon,
    label: viewTraceMessages.viewTrace,
    disabledReason: null,
    run: () => {
      openPage(
        project.itemTrace(id),
        title === undefined ? {} : { title: viewTraceMessages.traceTitle(title) },
      )
    },
  })
}
