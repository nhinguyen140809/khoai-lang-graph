import { notFound } from 'next/navigation'

import { DesignSystemPage } from '@/modules/design-system/widgets/showcase'
import { isProduction } from '@/shared/config/env'

export default function Page() {
  // A page for reviewing the design system while developing; production builds answer 404.
  if (isProduction) {
    notFound()
  }
  return <DesignSystemPage />
}
