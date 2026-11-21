'use client'

import Link from 'next/link'
import { useId } from 'react'

import { projectName, useRecentProjects } from '@/modules/project/entities'
import { noRunLabel, RunStatusBadge } from '@/modules/run/entities'
import { errorMessageOf } from '@/shared/api/error'
import { ErrorState } from '@/shared/components/state'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { RelativeTime } from '@/shared/components/ui/relative-time'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useNow } from '@/shared/lib/time'
import { useWording } from '@/shared/lib/view'
import { userRoutes } from '@/shared/routes'

import { projectCardCount, projectCardsMessages } from '../project-cards.constants'

/**
 * The latest projects of the user as cards in a grid, each opening its project, with the status
 * that its runs roll up to and the time of its last activity; a user without a project sees
 * nothing, as the prompt above says what to do. A link leads on to every project.
 * @view user
 */
export function ProjectCards() {
  const headingId = useId()
  const projects = useRecentProjects(projectCardCount)
  // One clock for the cards: each of them counts from it.
  const now = useNow()
  const noRun = useWording(noRunLabel)

  if (projects.isError) {
    return (
      <ErrorState
        message={errorMessageOf(projects.error)}
        onRetry={() => void projects.refetch()}
      />
    )
  }
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
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data === undefined
          ? [0, 1, 2].map((index) => (
              <li key={index}>
                <Skeleton className="h-24 rounded-xl" />
              </li>
            ))
          : projects.data.map((project) => (
              <li key={project.id}>
                {/* The link covers the card, so that the whole card opens the project. */}
                <Card className="relative h-full transition-colors hover:bg-muted/50">
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
                    {project.rollup_run_status === null ? (
                      <span>{noRun}</span>
                    ) : (
                      <RunStatusBadge status={project.rollup_run_status} />
                    )}
                    <RelativeTime date={project.last_activity_at} now={now} />
                  </CardContent>
                </Card>
              </li>
            ))}
      </ul>
    </section>
  )
}
