import { redirect } from 'next/navigation'

import { featureHref } from '@/components/layout/activity-bar.config'

/** A project opens at Session. */
export default async function Page({ params }: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  redirect(featureHref(projectId, 'session'))
}
