'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiError } from '@/shared/api/api-fetch.utils'
import { authHref, safeNextPath } from '@/shared/api/auth-redirect.utils'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/spinner'

import { login } from '../account.api'
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
  if (error instanceof ApiError && error.status === 401)
    return 'The email or the password is wrong.'
  if (error instanceof ApiError && error.status === 429) {
    return 'Too many attempts. Wait a moment, then try again.'
  }
  return error.message
}

export function LoginPage({ next }: LoginPageProps) {
  const router = useRouter()
  const signIn = useMutation({ mutationFn: login })
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    signIn.mutate(values, {
      onSuccess: () => {
        router.replace(safeNextPath(next) as Route)
      },
    })
  })

  return (
    <AuthCard
      title="Sign in"
      description="Sign in to open your projects."
      footer={
        <>
          No account yet?{' '}
          <Link
            href={authHref('/register', next) as Route}
            className="text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
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
