'use client'

import { useState } from 'react'

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useChangeProfile } from '../hooks/useAccountQueries'
import type { Profile } from '../settings.types'
import { SaveBar } from './SaveBar'

/** The name and the picture of the user; the email is shown and cannot be changed here. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const save = useChangeProfile()
  const [name, setName] = useState(profile.display_name)
  const [avatar, setAvatar] = useState(profile.avatar_url ?? '')
  const [problem, setProblem] = useState<string | null>(null)
  const errors = serverFieldErrors(save.error)

  return (
    <form
      noValidate
      aria-label="Profile"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim() === '') {
          setProblem('Enter your name.')
          return
        }
        setProblem(null)
        const picture = avatar.trim()
        save.mutate({ display_name: name.trim(), avatar_url: picture === '' ? null : picture })
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input id="profile-email" value={profile.email} readOnly />
        </Field>
        <Field data-invalid={(problem ?? errors.display_name) !== undefined}>
          <FieldLabel htmlFor="profile-name">Name</FieldLabel>
          <Input
            id="profile-name"
            value={name}
            autoComplete="name"
            aria-invalid={(problem ?? errors.display_name) !== undefined}
            onChange={(event) => {
              setName(event.target.value)
            }}
          />
          <FieldError>{problem ?? errors.display_name}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-avatar">Picture</FieldLabel>
          <Input
            id="profile-avatar"
            value={avatar}
            placeholder="https://"
            onChange={(event) => {
              setAvatar(event.target.value)
            }}
          />
          <FieldDescription>The address of an image. Empty shows your initials.</FieldDescription>
        </Field>
      </FieldGroup>
      <SaveBar
        pending={save.isPending}
        error={formErrorMessage(save.error)}
        saved={save.isSuccess}
      />
    </form>
  )
}
