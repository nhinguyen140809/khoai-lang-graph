'use client'

import { useEffect, useLayoutEffect } from 'react'

import { hasNews, type Project } from '@/modules/project/entities'

import { useProjectNewsStore } from '../project-news.store'

/** Reads what the user has seen of the projects from the browser, once the page has shown. */
export function useRestoreProjectNews() {
  useLayoutEffect(() => {
    void useProjectNewsStore.persist.rehydrate()
  }, [])
}

/**
 * Whether a project has news: activity after the last one the user has seen. A project that the
 * user has not opened yet has none, so that a new account does not start with every project marked.
 * While `isOpen`, the project is on show, so its activity counts as seen.
 */
export function useProjectNews(project: Project, isOpen: boolean): boolean {
  const seen = useProjectNewsStore((state) => state.seenAt[project.id])
  const markSeen = useProjectNewsStore((state) => state.markSeen)

  useEffect(() => {
    if (isOpen) markSeen(project.id, project.last_activity_at)
  }, [isOpen, markSeen, project.id, project.last_activity_at])

  return !isOpen && hasNews(seen, project.last_activity_at)
}
