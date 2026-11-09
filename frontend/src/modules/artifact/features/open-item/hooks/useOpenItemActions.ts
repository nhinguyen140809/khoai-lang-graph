'use client'

import { ArrowRightIcon, ExternalLinkIcon } from 'lucide-react'

import { useOpenPage } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

import { openItemMessages } from '../open-item.constants'
import type { OpenableItem, OpenItemActions } from '../open-item.types'

/**
 * The ways to open the page of an item of a project, from a menu, a button or a canvas, with one
 * behavior wherever they sit.
 * The page opens in the preview tab: it takes the place of the preview tab when there is one, else
 * it opens next to the tab shown last, and no tab that was kept is ever replaced. Only "Open in a
 * new tab" keeps its tab. The tab is named after the item until the page knows its own title.
 */
export function useOpenItemActions(projectId: string): (item: OpenableItem) => OpenItemActions {
  const openPage = useOpenPage()
  const project = routes.project(projectId)

  return ({ id, title }) => {
    const named = title === undefined ? {} : { title }
    return {
      open: {
        icon: ArrowRightIcon,
        label: openItemMessages.open,
        disabledReason: null,
        run: () => {
          openPage(project.item(id), named)
        },
      },
      openInNewTab: {
        icon: ExternalLinkIcon,
        label: openItemMessages.openInNewTab,
        disabledReason: null,
        run: () => {
          openPage(project.item(id), { ...named, keep: true })
        },
      },
    }
  }
}
