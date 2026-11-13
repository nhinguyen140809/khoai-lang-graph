import { redirect } from 'next/navigation'

import { routes } from '@/shared/routes'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

export default function Page() {
  redirect(routes.projects())
}
