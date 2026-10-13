import { Suspense } from 'react'

import { UserSettingsPage } from '@/features/settings'
import { LoadingState } from '@/shared/components/state'

export default function Page() {
  // The page reads its section from the address, which a static prerender does not have.
  return (
    <Suspense fallback={<LoadingState label="Loading your settings" />}>
      <UserSettingsPage />
    </Suspense>
  )
}
