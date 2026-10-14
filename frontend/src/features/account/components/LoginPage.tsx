'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiErrorCode, HttpStatus } from '@/shared/api/api-error.constants'
import { ApiError } from '@/shared/api/api-error.utils'
import { authHref, AuthPage } from '@/shared/api/auth-redirect.utils'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Spinner } from '@/shared/components/ui/spinner'

import { login } from '../account.api'
import { useOpenAfterSignIn } from '../hooks/useOpenAfterSignIn'
import { AuthCard } from './AuthCard'

const formSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
})

type FormValues = z.infer<typeof formSchema>

interface LoginPageProps {
  /** The page to return to after signing in. */
  next: string | null
}

function errorMessage(error: Error): string {
  if (!(error instanceof ApiError)) return error.message
  if (error.status === HttpStatus.Unauthorized) return 'The email or the password is wrong.'
  if (error.code === ApiErrorCode.RateLimited) {
    return 'Too many attempts. Wait a moment, then try again.'
  }
  return error.message
}

export function LoginPage({ next }: LoginPageProps) {
  const openAfterSignIn = useOpenAfterSignIn(next)
  const signIn = useMutation({ mutationFn: login })
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    signIn.mutate(values, { onSuccess: openAfterSignIn })
  })

  return (
    <AuthCard
      title="Sign in"
      description="Sign in to open your projects."
      switchTo={{
        prompt: 'No account yet?',
        label: 'Create an account',
        href: authHref(AuthPage.Register, next),
      }}
    >
      <form
        noValidate
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FieldGroup>
          <Field data-invalid={errors.email !== undefined}>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email !== undefined}
              {...form.register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={errors.password !== undefined}>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password !== undefined}
              {...form.register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          {signIn.isError && (
            <p role="alert" className="text-xs text-destructive">
              {errorMessage(signIn.error)}
            </p>
          )}
          <Button type="submit" disabled={signIn.isPending} className="w-full">
            {signIn.isPending && <Spinner aria-label="Signing in" />}
            Sign in
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
