'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useUserSettings } from '@/modules/user/entities'
import { routes } from '@/shared/routes'

/**
 * Sends a user who has not chosen a view yet to the page that asks, once their settings load.
 * Whoever has chosen is never asked again, on any host or device, and may change the choice in the
 * settings. It shows nothing.
 */
export function ViewGate() {
  const router = useRouter()
  const settings = useUserSettings()
  const isUnchosen = settings.data?.preferred_view === null

  useEffect(() => {
    if (isUnchosen) router.replace(routes.views())
  }, [isUnchosen, router])

  return null
}
