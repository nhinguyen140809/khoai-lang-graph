import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { logout } from '@/modules/auth/entities'
import { HttpStatus } from '@/shared/api/error/api-error.types'
import { ApiError, errorMessageOf } from '@/shared/api/error/api-error.utils'
import { reloadTo } from '@/shared/lib/url/reload.utils'
import { routes } from '@/shared/routes'

/**
 * Ends the session, then loads the login page in full, so that the data of this session does not
 * show to whoever logs in next. A failure shows as a toast.
 */
export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      reloadTo(routes.login())
    },
    onError: (error) => {
      // Without a session the query client opens the login page already.
      if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) return
      toast.error(errorMessageOf(error, {}))
    },
  })
}
