import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { login, register, type RegisterBody, useRedirectAfterLogin } from '@/modules/auth/entities'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'
import { routes } from '@/shared/routes'

import { registerMessages } from '../register.constants'
import { type RegisterForm, registerFormSchema } from '../register.schema'

/**
 * Creates an account, then logs in with it, since registering does not start a session,
 * and opens the page to return to. When logging in fails, the account exists already, so the
 * login page opens instead. The problems of the API show at the fields of the form through
 * `setError`, and `formError` holds any other failure.
 */
export function useRegister(next: string | null, setError: UseFormSetError<RegisterForm>) {
  const router = useRouter()
  const redirectAfterLogin = useRedirectAfterLogin(next)
  const registration = useMutation({
    // Resolves to whether logging in worked too.
    mutationFn: async (body: RegisterBody) => {
      await register(body)
      try {
        await login({ email: body.email, password: body.password })
      } catch {
        return false
      }
      return true
    },
    onSuccess: (loggedIn) => {
      if (loggedIn) {
        redirectAfterLogin()
        return
      }
      toast.info(registerMessages.createdWithoutSession)
      router.replace(routes.login(next))
    },
    onError: (error) => {
      showFieldProblems(setError, error, registerFormSchema)
    },
  })
  return { ...registration, formError: formErrorOf(registration.error, registerFormSchema) }
}
