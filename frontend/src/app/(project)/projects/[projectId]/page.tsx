import { redirect } from 'next/navigation'

import { consoleHref } from '@/features/console'

/** A project opens at Console. */
export default async function Page({ params }: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  redirect(consoleHref(projectId))
}
