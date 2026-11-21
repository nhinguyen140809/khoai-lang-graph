'use client'

import Link from 'next/link'
import { useId } from 'react'

import {
  noticeableRunStatus,
  type Project,
  projectName,
  useRecentProjects,
} from '@/modules/project/entities'
import { useRunStatusLook } from '@/modules/run/entities'
import { errorMessageOf } from '@/shared/api/error'
import { ErrorState } from '@/shared/components/state'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { RelativeTime } from '@/shared/components/ui/relative-time'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useNow } from '@/shared/lib/time'
import { userRoutes } from '@/shared/routes'

import { projectCardCount, projectCardsMessages } from '../project-cards.constants'

/**
 * The latest projects of the user as cards in a grid, each opening its project, with the mark of the
 * status that its runs roll up to, when it asks for the user or works, and the time of its last activity; a user without a project sees
 * nothing, as the prompt above says what to do. The heading stays when the projects fail to load, with the error under it. A link leads on to every project.
 * @view user
 */
export function ProjectCards() {
  const headingId = useId()
  const projects = useRecentProjects(projectCardCount)
  // One clock for the cards: each of them counts from it.
  const now = useNow()

  if (projects.data?.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold">
          {projectCardsMessages.heading}
        </h2>
        <Link
          href={userRoutes.recents()}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {projectCardsMessages.all}
        </Link>
      </div>
      {projects.isError ? (
        <ErrorState
          message={errorMessageOf(projects.error)}
          onRetry={() => void projects.refetch()}
        />
      ) : (
        <ProjectCardGrid projects={projects.data} now={now} />
      )}
    </section>
  )
}

/** The status of a project as the icon of the side list, in the color of its tone; nothing for a status that does not ask for the user or work. */
function ProjectStatusMark({ status }: { status: Project['rollup_run_status'] }) {
  const noticeable = noticeableRunStatus(status)
  const look = useRunStatusLook(noticeable)
  // Kept as a span, so that the time stays at the end of the row without one.
  if (noticeable === null) return <span />
  return (
    <ColoredText color={look.tone} className="flex" title={look.label}>
      <look.icon className="size-3.5" aria-label={look.label} />
    </ColoredText>
  )
}

/** The cards of the projects, or the placeholders of them while they load. */
function ProjectCardGrid({ projects, now }: { projects: Project[] | undefined; now: Date }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects === undefined
        ? [0, 1, 2].map((index) => (
            <li key={index}>
              <Skeleton className="h-24 rounded-xl" />
            </li>
          ))
        : projects.map((project) => (
            <li key={project.id}>
              {/* The link covers the card, so that the whole card opens the project. */}
              <Card className="relative h-full ring-border transition-colors hover:bg-muted/50 hover:ring-primary/40">
                <CardHeader>
                  <CardTitle className="truncate">
                    <Link
                      href={userRoutes.project(project.id)}
                      className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring/50"
                    >
                      {projectName(project)}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 text-muted-foreground">
                  <ProjectStatusMark status={project.rollup_run_status} />
                  <RelativeTime date={project.last_activity_at} now={now} />
                </CardContent>
              </Card>
            </li>
          ))}
    </ul>
  )
}
