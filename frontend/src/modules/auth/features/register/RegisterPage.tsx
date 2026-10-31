'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Form, TextField } from '@/shared/components/form'
import { AuthScreen } from '@/shared/components/frame'
import { FieldError, FieldGroup } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { routes } from '@/shared/routes'

import { type RegisterForm, registerFormSchema } from './register.schema'
import { useRegister } from './useRegister'

interface RegisterPageProps {
  /** The page to open after the account is created. */
  next: string | null
}

export function RegisterPage({ next }: RegisterPageProps) {
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { display_name: '', email: '', password: '' },
  })
  const registration = useRegister(next, form.setError)

  const onSubmit = form.handleSubmit((values) => {
    registration.mutate(values)
  })

  return (
    <AuthScreen
      title="Create an account"
      description="An account keeps your projects, your settings and the models you choose."
      switchTo={{
        prompt: 'Have an account?',
        label: 'Log in',
        href: routes.login(next),
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
          <FieldError>{registration.formError}</FieldError>
          <PendingButton
            type="submit"
            pending={registration.isPending}
            pendingLabel="Creating the account"
            className="w-full"
          >
            Register
          </PendingButton>
        </FieldGroup>
      </Form>
    </AuthScreen>
  )
}
