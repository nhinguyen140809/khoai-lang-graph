import { useMutation } from '@tanstack/react-query'

import { ApiErrorCode, HttpStatus } from '@/shared/api/api-error.constants'
import { ApiError } from '@/shared/api/api-error.utils'

import { login } from '../account.api'
import { useOpenAfterSignIn } from './useOpenAfterSignIn'

// What the sign-in page says when signing in fails.
function errorMessageOf(error: Error): string {
  if (!(error instanceof ApiError)) return error.message
  if (error.status === HttpStatus.Unauthorized) return 'The email or the password is wrong.'
  if (error.code === ApiErrorCode.RateLimited) {
    return 'Too many attempts. Wait a moment, then try again.'
  }
  return error.message
}

/**
 * Signs in, then opens the page to return to: `next` when it is a page of this app.
 * `errorMessage` says why the last attempt failed.
 */
export function useSignIn(next: string | null) {
  const openAfterSignIn = useOpenAfterSignIn(next)
  const signIn = useMutation({ mutationFn: login, onSuccess: openAfterSignIn })
  return { ...signIn, errorMessage: signIn.error === null ? null : errorMessageOf(signIn.error) }
}
