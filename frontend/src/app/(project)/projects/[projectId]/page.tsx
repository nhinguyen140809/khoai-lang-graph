import { redirect } from 'next/navigation'

import { consoleHref } from '@/shared/config/routes.utils'

/** A project opens at Console. */
export default async function Page({ params }: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  redirect(consoleHref(projectId))
}
