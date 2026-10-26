import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { login, register, type RegisterBody, useOpenAfterSignIn } from '@/modules/auth/entities'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'
import { routes } from '@/shared/routes'

import { signUpMessages } from '../register.constants'
import { type AccountForm, accountFormSchema } from '../register.schema'

/**
 * Creates an account, then signs in with it, since creating an account does not start a session,
 * and opens the page to return to. When signing in fails, the account exists already, so the
 * sign-in page opens instead. The problems of the API show at the fields of the form through
 * `setError`, and `formError` holds any other failure.
 */
export function useCreateAccount(next: string | null, setError: UseFormSetError<AccountForm>) {
  const router = useRouter()
  const openAfterSignIn = useOpenAfterSignIn(next)
  const createAccount = useMutation({
    // Resolves to whether signing in worked too.
    mutationFn: async (body: RegisterBody) => {
      await register(body)
      try {
        await login({ email: body.email, password: body.password })
      } catch {
        return false
      }
      return true
    },
    onSuccess: (signedIn) => {
      if (signedIn) {
        openAfterSignIn()
        return
      }
      toast.info(signUpMessages.createdWithoutSession)
      router.replace(routes.signIn(next))
    },
    onError: (error) => {
      showFieldProblems(setError, error, accountFormSchema)
    },
  })
  return { ...createAccount, formError: formErrorOf(createAccount.error, accountFormSchema) }
}
