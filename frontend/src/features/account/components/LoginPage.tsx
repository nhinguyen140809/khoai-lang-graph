'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { FieldGroup } from '@/shared/components/ui/field'
import { Spinner } from '@/shared/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { routes } from '@/shared/config/routes'

import { type SignInForm, signInFormSchema } from '../account.schema'
import { useSignIn } from '../hooks/useSignIn'
import { AuthScreen } from './AuthScreen'

interface LoginPageProps {
  /** The page to return to after signing in. */
  next: string | null
}

export function LoginPage({ next }: LoginPageProps) {
  const signIn = useSignIn(next)
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    signIn.mutate(values)
  })

  return (
    <AuthScreen
      title="Sign in"
      description="Sign in to open your projects."
      switchTo={{
        prompt: 'No account yet?',
        label: 'Create an account',
        href: routes.register(next),
      }}
    >
      <form
        noValidate
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FieldGroup>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          {/* Under the password, at the end of its field. */}
          <div className="-mt-2 flex justify-end">
            <ForgotPassword />
          </div>
          {signIn.errorMessage !== null && (
            <p role="alert" className="text-sm text-destructive">
              {signIn.errorMessage}
            </p>
          )}
          <Button type="submit" disabled={signIn.isPending} className="w-full">
            {signIn.isPending && <Spinner aria-label="Signing in" />}
            Sign in
          </Button>
        </FieldGroup>
      </form>
    </AuthScreen>
  )
}

// TODO: open the reset of a password once the API can send a reset link.
/** The place of the link that resets a password, which says that it is not available yet. */
function ForgotPassword() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="link"
          aria-disabled
          className="h-auto p-0 text-sm aria-disabled:cursor-not-allowed"
        >
          Forgot password?
        </Button>
      </TooltipTrigger>
      <TooltipContent>Resetting a password is not available yet.</TooltipContent>
    </Tooltip>
  )
}
