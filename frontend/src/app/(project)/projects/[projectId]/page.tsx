import { redirect } from 'next/navigation'

import { routes } from '@/shared/routes'

/** A project opens at Activity. */
export default async function Page({ params }: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  redirect(routes.project(projectId).activity())
}
