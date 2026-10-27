import { notFound } from 'next/navigation'

import { isProduction } from '@/shared/config/env'

// A page that fails to render, for reviewing the error boundary around it while developing;
// production builds answer 404.
export default function Page() {
  if (isProduction) {
    notFound()
  }
  throw new Error('The page failed to render.')
}
