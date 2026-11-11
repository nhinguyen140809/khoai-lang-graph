import { LoginPage } from '@/modules/auth/features/login'
import { nextParam } from '@/shared/routes'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

export default async function Page({ searchParams }: PageProps<'/login'>) {
  return <LoginPage next={nextParam(await searchParams)} />
}
