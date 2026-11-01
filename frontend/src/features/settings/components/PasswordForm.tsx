'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { SaveBar, TextField } from '@/shared/components/form'
import { FieldGroup } from '@/shared/components/ui/field'

import { useChangePassword } from '../hooks/useAccountQueries'
import { passwordFormSchema } from '../settings.schema'

/** The current password and the new one, typed twice. */
export function PasswordForm() {
  const form = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { current_password: '', new_password: '', again: '' },
  })
  const change = useChangePassword(form.setError)

  const onSubmit = form.handleSubmit((body) => {
    change.mutate(body, {
      onSuccess: () => {
        form.reset()
      },
    })
  })

  return (
    <form
      noValidate
      aria-label="Password"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FieldGroup>
        <TextField
          control={form.control}
          name="current_password"
          label="Current password"
          type="password"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="new_password"
          label="New password"
          type="password"
          autoComplete="new-password"
        />
        <TextField
          control={form.control}
          name="again"
          label="New password again"
          type="password"
          autoComplete="new-password"
        />
      </FieldGroup>
      <SaveBar
        pending={change.isPending}
        error={change.formError}
        saved={change.isSuccess}
        label="Change password"
      />
    </form>
  )
}
