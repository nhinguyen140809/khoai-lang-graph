import Link from 'next/link'

import { NotFoundState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { routes } from '@/shared/config/routes'

import { projectMessages } from '../../constants/projects.constants'

/** The page of an address whose project does not exist, with the way to every project. */
export function ProjectNotFound({ projectId }: { projectId: string }) {
  return (
    <NotFoundState
      title={projectMessages.notFound}
      description={projectMessages.notFoundHint}
      reference={projectId}
      action={
        <Button asChild>
          <Link href={routes.projects()}>{projectMessages.all}</Link>
        </Button>
      }
    />
  )
}
