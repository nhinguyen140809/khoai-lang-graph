import { useMutation } from '@tanstack/react-query'

import { errorMessageOf } from '@/shared/api/api-error.utils'

import { login } from '../account.api'
import { accountMessages } from '../account.constants'
import { useOpenAfterSignIn } from './useOpenAfterSignIn'

/**
 * Signs in, then opens the page to return to: `next` when it is a page of this app.
 * `errorMessage` says why the last attempt failed.
 */
export function useSignIn(next: string | null) {
  const openAfterSignIn = useOpenAfterSignIn(next)
  const signIn = useMutation({ mutationFn: login, onSuccess: openAfterSignIn })
  return {
    ...signIn,
    errorMessage:
      signIn.error === null ? null : errorMessageOf(signIn.error, accountMessages.signInFailed),
  }
}
