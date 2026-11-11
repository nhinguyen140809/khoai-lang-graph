import { notFound } from 'next/navigation'

import { isProduction } from '@/shared/config/env'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

// A page that fails to render, for reviewing the error boundary around it while developing;
// production builds answer 404.
export default function Page() {
  if (isProduction) {
    notFound()
  }
  throw new Error('The page failed to render.')
}
