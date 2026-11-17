'use client'

import { usePathname } from 'next/navigation'

import {
  type Project,
  projectName,
  projectNewsLook,
  useProjectPages,
} from '@/modules/project/entities'
import { useProjectNews } from '@/modules/project/features/news'
import { useRunStatusLook } from '@/modules/run/entities'
import { inView, useView, useWording } from '@/shared/lib/view'

import { noticeableRunStatus } from '../project-sidebar.utils'

/**
 * What the row of a project in the side list shows: the address of its chat, its name, the look of
 * what it has to say at the end of its row, and the name of its link with that. A project says one thing,
 * the first that applies: a status that asks for the user, works or has stopped, then news.
 * `mark` is null when the project has nothing to say.
 */
export function useProjectRow(project: Project) {
  const pages = useProjectPages()
  const href = pages.project(project.id)
  const view = useView()
  const status = noticeableRunStatus(project.rollup_run_status)
  const statusLook = useRunStatusLook(status)
  const hasNews = useProjectNews(project, usePathname() === href)
  const newsLabel = useWording(projectNewsLook.label)
  const name = projectName(project)

  const mark =
    status !== null
      ? statusLook
      : hasNews
        ? {
            tone: inView(projectNewsLook.tone, view),
            icon: inView(projectNewsLook.icon, view),
            label: newsLabel,
          }
        : null

  return { href, name, mark, label: mark === null ? name : `${name}, ${mark.label}` }
}
