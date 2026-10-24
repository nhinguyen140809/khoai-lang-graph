import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { safeNextPath } from '@/shared/routes'

/**
 * Opens the page to return to after signing in: `next` when it is a page of this app. The queries
 * cached for an earlier session are dropped first, so that none of them shows to the new user.
 */
export function useOpenAfterSignIn(next: string | null): () => void {
  const router = useRouter()
  const queryClient = useQueryClient()
  return () => {
    queryClient.removeQueries()
    router.replace(safeNextPath(next))
  }
}
