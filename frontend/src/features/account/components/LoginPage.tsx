'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { FieldGroup } from '@/shared/components/ui/field'
import { Spinner } from '@/shared/components/ui/spinner'
import { routes } from '@/shared/config/routes'

import { type SignInForm, signInFormSchema } from '../account.schema'
import { useSignIn } from '../hooks/useSignIn'
import { AuthCard } from './AuthCard'

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
    <AuthCard
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
    </AuthCard>
  )
}
