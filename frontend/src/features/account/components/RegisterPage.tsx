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
import { Button } from '@/shared/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Spinner } from '@/shared/components/ui/spinner'

import { login, register } from '../account.api'
import type { RegisterBody } from '../account.types'
import { AuthCard } from './AuthCard'

const formSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name.'),
  email: z.email('Enter an email address.'),
  password: z.string().min(1, 'Enter a password.'),
})

type FormValues = z.infer<typeof formSchema>

const formFields = ['display_name', 'email', 'password'] as const

function isFormField(field: string): field is keyof FormValues {
  return formFields.some((name) => name === field)
}

interface RegisterPageProps {
  /** The page to open after the account is created. */
  next: string | null
}

/** Creates an account, then signs in with it: creating an account does not start a session. */
export function RegisterPage({ next }: RegisterPageProps) {
  const router = useRouter()
  const createAccount = useMutation({
    mutationFn: async (body: RegisterBody) => {
      await register(body)
      await login({ email: body.email, password: body.password })
    },
  })
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { display_name: '', email: '', password: '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    createAccount.mutate(values, {
      onSuccess: () => {
        router.replace(safeNextPath(next) as Route)
      },
      onError: (error) => {
        if (!(error instanceof ApiError)) return
        for (const { field, message } of error.fieldErrors) {
          if (isFormField(field)) form.setError(field, { message })
        }
      },
    })
  })

  // Field problems are shown at their field; any other failure under the form.
  const formError =
    createAccount.isError &&
    !(createAccount.error instanceof ApiError && createAccount.error.fieldErrors.length > 0)
      ? createAccount.error.message
      : null

  return (
    <AuthCard
      title="Create an account"
      description="An account keeps your projects, your settings and the models you choose."
      footer={
        <>
          Have an account?{' '}
          <Link
            href={authHref('/login', next) as Route}
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
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
          <Field data-invalid={errors.display_name !== undefined}>
            <FieldLabel htmlFor="register-name">Name</FieldLabel>
            <Input
              id="register-name"
              autoComplete="name"
              aria-invalid={errors.display_name !== undefined}
              {...form.register('display_name')}
            />
            <FieldError errors={[errors.display_name]} />
          </Field>
          <Field data-invalid={errors.email !== undefined}>
            <FieldLabel htmlFor="register-email">Email</FieldLabel>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email !== undefined}
              {...form.register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={errors.password !== undefined}>
            <FieldLabel htmlFor="register-password">Password</FieldLabel>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password !== undefined}
              {...form.register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          {formError !== null && (
            <p role="alert" className="text-xs text-destructive">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={createAccount.isPending} className="w-full">
            {createAccount.isPending && <Spinner aria-label="Creating the account" />}
            Create account
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
