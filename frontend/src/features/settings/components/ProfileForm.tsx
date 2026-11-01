'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'

import { SaveBar, TextField } from '@/shared/components/form'
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

import { useChangeProfile } from '../hooks/useAccountQueries'
import { profileFormSchema } from '../settings.schema'
import type { Profile } from '../settings.types'

/** The name and the picture of the user; the email is shown and cannot be changed here. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { display_name: profile.display_name, avatar_url: profile.avatar_url ?? '' },
  })
  const save = useChangeProfile(form.setError)
  const emailId = useId()

  const onSubmit = form.handleSubmit((body) => {
    save.mutate(body)
  })

  return (
    <form
      noValidate
      aria-label="Profile"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={emailId}>Email</FieldLabel>
          <Input id={emailId} value={profile.email} readOnly />
        </Field>
        <TextField control={form.control} name="display_name" label="Name" autoComplete="name" />
        <TextField
          control={form.control}
          name="avatar_url"
          label="Picture"
          placeholder="https://"
          description="The address of an image. Empty shows your initials."
        />
      </FieldGroup>
      <SaveBar pending={save.isPending} error={save.formError} saved={save.isSuccess} />
    </form>
  )
}
