import { notFound } from 'next/navigation'

import { DesignSystemPage } from '@/modules/design-system/widgets/showcase'
import { isProduction } from '@/shared/config/env'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

export default function Page() {
  // A page for reviewing the design system while developing; production builds answer 404.
  if (isProduction) {
    notFound()
  }
  return <DesignSystemPage />
}
