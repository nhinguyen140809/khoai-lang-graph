'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { FieldGroup } from '@/shared/components/ui/field'
import { Spinner } from '@/shared/components/ui/spinner'
import { routes } from '@/shared/config/routes'

import { type AccountForm, accountFormSchema } from '../account.schema'
import { useCreateAccount } from '../hooks/useCreateAccount'
import { AuthCard } from './AuthCard'

interface RegisterPageProps {
  /** The page to open after the account is created. */
  next: string | null
}

export function RegisterPage({ next }: RegisterPageProps) {
  const form = useForm<AccountForm>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { display_name: '', email: '', password: '' },
  })
  const createAccount = useCreateAccount(next, form.setError)

  const onSubmit = form.handleSubmit((values) => {
    createAccount.mutate(values)
  })

  return (
    <AuthCard
      title="Create an account"
      description="An account keeps your projects, your settings and the models you choose."
      switchTo={{
        prompt: 'Have an account?',
        label: 'Sign in',
        href: routes.signIn(next),
      }}
    >
      <form
        noValidate
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FieldGroup>
          <TextField control={form.control} name="display_name" label="Name" autoComplete="name" />
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
            autoComplete="new-password"
          />
          {createAccount.formError !== null && (
            <p role="alert" className="text-sm text-destructive">
              {createAccount.formError}
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
