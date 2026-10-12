import { Suspense } from 'react'

import { LoadingState } from '@/components/state'
import { UserSettingsPage } from '@/features/settings'

export default function Page() {
  // The page reads its section from the address, which a static prerender does not have.
  return (
    <Suspense fallback={<LoadingState label="Loading your settings" />}>
      <UserSettingsPage />
    </Suspense>
  )
}
