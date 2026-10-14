import { redirect } from 'next/navigation'

import { routes } from '@/shared/config/routes'

/** A project opens at Console. */
export default async function Page({ params }: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  redirect(routes.project(projectId).console())
}
