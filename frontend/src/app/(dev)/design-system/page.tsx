import { notFound } from 'next/navigation'

import { DesignSystemPage } from '@/features/design-system'

export default function Page() {
  // A page for reviewing the design system while developing; production builds answer 404.
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <DesignSystemPage />
}
