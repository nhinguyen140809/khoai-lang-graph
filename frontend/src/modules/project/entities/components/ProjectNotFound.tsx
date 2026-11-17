'use client'

import Link from 'next/link'

import { NotFoundState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'

import { useProjectPages } from '../projects/hooks/useProjectPages'
import { projectMessages } from '../projects/projects.constants'

/** The page of an address whose project does not exist, with the way to the other projects. */
export function ProjectNotFound({ projectId }: { projectId: string }) {
  const pages = useProjectPages()

  return (
    <NotFoundState
      title={projectMessages.notFound}
      description={projectMessages.notFoundHint}
      reference={projectId}
      action={
        <Button asChild>
          <Link href={pages.start()}>{projectMessages.all}</Link>
        </Button>
      }
    />
  )
}
