'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'
import { Textarea } from '@/shared/components/ui/textarea'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useUpdateProject } from '../hooks/useUpdateProject'
import {
  outputLanguageLabels,
  outputLanguages,
  type SettingsProject,
} from '../project-settings.types'
import { SaveBar } from './SaveBar'

/** The name, the description and the output language of the project, and its archive. */
export function GeneralForm({ project }: { project: SettingsProject }) {
  const update = useUpdateProject(project.id)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [language, setLanguage] = useState<string>(project.output_language)
  const [nameProblem, setNameProblem] = useState<string | null>(null)
  const fieldErrors = serverFieldErrors(update.error)

  const save = () => {
    if (name.trim() === '') {
      setNameProblem('Enter a name.')
      return
    }
    setNameProblem(null)
    const text = description.trim()
    update.mutate({
      name: name.trim(),
      description: text === '' ? null : text,
      output_language: language === 'vi' ? 'vi' : 'en',
    })
  }

  const archived = project.status === 'archived'

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <form
        noValidate
        aria-label="General"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <FieldGroup>
          <Field data-invalid={(nameProblem ?? fieldErrors.name) !== undefined}>
            <FieldLabel htmlFor="project-name">Name</FieldLabel>
            <Input
              id="project-name"
              autoComplete="off"
              value={name}
              aria-invalid={(nameProblem ?? fieldErrors.name) !== undefined}
              onChange={(event) => {
                setName(event.target.value)
              }}
            />
            <FieldError>{nameProblem ?? fieldErrors.name}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="project-description">Description</FieldLabel>
            <Textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-language">Output language</FieldLabel>
            <NativeSelect
              id="project-language"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value)
              }}
            >
              {outputLanguages.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {outputLanguageLabels[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>The language the agents write the artifacts in.</FieldDescription>
            <FieldError>{fieldErrors.output_language}</FieldError>
          </Field>
        </FieldGroup>
        <SaveBar
          pending={update.isPending}
          error={formErrorMessage(update.error)}
          saved={update.isSuccess}
        />
      </form>

      <section aria-label="Archive" className="flex flex-col gap-2 border-t pt-4">
        <h3 className="text-xs font-medium">{archived ? 'Archived project' : 'Archive'}</h3>
        <p className="text-xs text-muted-foreground">
          {archived
            ? 'The project is hidden from the list of active projects. Restore it to work on it again.'
            : 'An archived project is hidden from the list of active projects. Nothing in it is deleted.'}
        </p>
        <div>
          <Button
            variant="outline"
            disabled={update.isPending}
            onClick={() => {
              update.mutate({ status: archived ? 'active' : 'archived' })
            }}
          >
            {archived ? 'Restore the project' : 'Archive the project'}
          </Button>
        </div>
      </section>
    </div>
  )
}
