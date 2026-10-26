import { useMutation } from '@tanstack/react-query'

import { login, useRedirectAfterLogin } from '@/modules/auth/entities'
import { errorMessageOf } from '@/shared/api/error'

import { loginMessages } from '../login.constants'

/**
 * Logs in, then opens the page to return to: `next` when it is a page of this app.
 * `errorMessage` says why the last attempt failed.
 */
export function useLogin(next: string | null) {
  const redirectAfterLogin = useRedirectAfterLogin(next)
  const loginRequest = useMutation({ mutationFn: login, onSuccess: redirectAfterLogin })
  return {
    ...loginRequest,
    errorMessage:
      loginRequest.error === null ? null : errorMessageOf(loginRequest.error, loginMessages.failed),
  }
}
