import { redirect } from 'next/navigation'

import { routes } from '@/shared/routes'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** A project opens at Activity. */
export default async function Page({ params }: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params
  redirect(routes.project(projectId).activity())
}
