'use client'

import type { ReactNode } from 'react'

import { type ChatReference, ReferenceOpenerProvider } from '@/modules/activity/entities'
import { useEditorTab, useOpenPage } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

import { activityTabMessages } from './activity-tab.constants'

interface ActivityTabProps {
  projectId: string
  /** The chat of the project. */
  children: ReactNode
}

/**
 * The chat of a project as a page of the workbench: it has a tab, and a document or an item that
 * the chat names opens as a page in a tab of its own.
 * @view developer
 */
export function ActivityTab({ projectId, children }: ActivityTabProps) {
  useEditorTab({
    id: 'activity',
    title: activityTabMessages.title,
    href: routes.project(projectId).activity(),
  })
  const openPage = useOpenPage()
  const openReference = (reference: ChatReference) => {
    const pages = routes.project(projectId)
    openPage(
      reference.kind === 'document'
        ? pages.document(reference.artifactId)
        : pages.item(reference.itemId),
    )
  }

  return <ReferenceOpenerProvider opener={openReference}>{children}</ReferenceOpenerProvider>
}
