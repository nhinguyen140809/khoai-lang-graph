'use client'

import { useState } from 'react'

import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useChangePassword } from '../hooks/useAccountQueries'
import { SaveBar } from './SaveBar'

const MIN_LENGTH = 8

/** The current password and the new one, typed twice. */
export function PasswordForm() {
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [problems, setProblems] = useState<Record<string, string>>({})
  const shown = { ...serverFieldErrors(change.error), ...problems }

  return (
    <form
      noValidate
      aria-label="Password"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const found: Record<string, string> = {}
        if (current === '') found.current_password = 'Enter your current password.'
        if (next.length < MIN_LENGTH)
          found.new_password = `Use at least ${String(MIN_LENGTH)} characters.`
        else if (again !== next) found.again = 'The two passwords differ.'
        setProblems(found)
        if (Object.keys(found).length > 0) return
        change.mutate(
          { current_password: current, new_password: next },
          {
            onSuccess: () => {
              setCurrent('')
              setNext('')
              setAgain('')
            },
          },
        )
      }}
    >
      <FieldGroup>
        {(
          [
            ['current_password', 'Current password', current, setCurrent, 'current-password'],
            ['new_password', 'New password', next, setNext, 'new-password'],
            ['again', 'New password again', again, setAgain, 'new-password'],
          ] as const
        ).map(([name, label, value, setValue, autoComplete]) => (
          <Field key={name} data-invalid={shown[name] !== undefined}>
            <FieldLabel htmlFor={`password-${name}`}>{label}</FieldLabel>
            <Input
              id={`password-${name}`}
              type="password"
              value={value}
              autoComplete={autoComplete}
              aria-invalid={shown[name] !== undefined}
              onChange={(event) => {
                setValue(event.target.value)
              }}
            />
            <FieldError>{shown[name]}</FieldError>
          </Field>
        ))}
      </FieldGroup>
      <SaveBar
        pending={change.isPending}
        error={formErrorMessage(change.error)}
        saved={change.isSuccess}
        label="Change password"
      />
    </form>
  )
}
