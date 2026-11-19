'use client'

import type { LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'

import {
  type Project,
  projectName,
  projectNewsLook,
  useProjectPages,
} from '@/modules/project/entities'
import { useProjectNews } from '@/modules/project/features/news'
import { useRunStatusLook } from '@/modules/run/entities'
import type { Tone } from '@/shared/lib/tone'
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

  const newsMark = {
    tone: inView(projectNewsLook.tone, view),
    icon: inView(projectNewsLook.icon, view),
    label: newsLabel,
  }
  const mark = firstMark(status !== null ? statusLook : null, hasNews ? newsMark : null)

  return { href, name, mark, label: mark === null ? name : `${name}, ${mark.label}` }
}

/** What the end of a row shows for what the project has to say. */
interface RowMark {
  tone: Tone
  icon: LucideIcon
  label: string
}

/** The first mark that a project has to show, in the order of what it says; null without one. */
function firstMark(...marks: (RowMark | null)[]): RowMark | null {
  return marks.find((mark) => mark !== null) ?? null
}
