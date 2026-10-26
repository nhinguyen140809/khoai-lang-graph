'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Form, TextField } from '@/shared/components/form'
import { AuthScreen } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldGroup } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { routes } from '@/shared/routes'

import { useLogin } from '../hooks/useLogin'
import { type LoginForm, loginFormSchema } from '../login.schema'

interface LoginPageProps {
  /** The page to return to after logging in. */
  next: string | null
}

export function LoginPage({ next }: LoginPageProps) {
  const loginRequest = useLogin(next)
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    loginRequest.mutate(values)
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
      <Form onSubmit={onSubmit}>
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
            action={<ForgotPassword />}
          />
          <FieldError>{loginRequest.errorMessage}</FieldError>
          <PendingButton
            type="submit"
            pending={loginRequest.isPending}
            pendingLabel="Signing in"
            className="w-full"
          >
            Sign in
          </PendingButton>
        </FieldGroup>
      </Form>
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
