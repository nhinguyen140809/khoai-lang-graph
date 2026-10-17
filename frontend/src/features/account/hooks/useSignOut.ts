import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { HttpStatus } from '@/shared/api/api-error.constants'
import { ApiError, errorMessageOf } from '@/shared/api/api-error.utils'
import { loadPage } from '@/shared/api/auth-redirect.utils'
import { routes } from '@/shared/config/routes'

import { logout } from '../account.api'

/**
 * Ends the session, then loads the sign-in page in full, so that the data of this session does not
 * show to whoever signs in next. A failure shows as a toast.
 */
export function useSignOut() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      loadPage(routes.signIn())
    },
    onError: (error) => {
      // Without a session the query client opens the sign-in page already.
      if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) return
      toast.error(errorMessageOf(error, {}))
    },
  })
}
