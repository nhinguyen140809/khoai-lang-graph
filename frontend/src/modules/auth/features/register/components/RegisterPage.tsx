'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Form, TextField } from '@/shared/components/form'
import { AuthScreen } from '@/shared/components/frame'
import { FieldError, FieldGroup } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { routes } from '@/shared/routes'

import { useCreateAccount } from '../hooks/useRegister'
import { type AccountForm, accountFormSchema } from '../register.schema'

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
    <AuthScreen
      title="Create an account"
      description="An account keeps your projects, your settings and the models you choose."
      switchTo={{
        prompt: 'Have an account?',
        label: 'Sign in',
        href: routes.signIn(next),
      }}
    >
      <Form onSubmit={onSubmit}>
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
          <FieldError>{createAccount.formError}</FieldError>
          <PendingButton
            type="submit"
            pending={createAccount.isPending}
            pendingLabel="Creating the account"
            className="w-full"
          >
            Create account
          </PendingButton>
        </FieldGroup>
      </Form>
    </AuthScreen>
  )
}
