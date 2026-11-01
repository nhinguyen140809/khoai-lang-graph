'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField, SaveBar, TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { FieldGroup } from '@/shared/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'
import { Textarea } from '@/shared/components/ui/textarea'

import { useUpdateProject } from '../hooks/useUpdateProject'
import { generalFormSchema } from '../project-settings.schema'
import {
  outputLanguageLabels,
  outputLanguages,
  type SettingsProject,
} from '../project-settings.types'

/** The name, the description and the output language of the project, and its archive. */
export function GeneralForm({ project }: { project: SettingsProject }) {
  const form = useForm({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      output_language: project.output_language,
    },
  })
  const update = useUpdateProject(project.id, {
    setError: form.setError,
    schema: generalFormSchema,
  })

  const onSubmit = form.handleSubmit((patch) => {
    update.mutate(patch)
  })

  const archived = project.status === 'archived'

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <form
        noValidate
        aria-label="General"
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FieldGroup>
          <TextField control={form.control} name="name" label="Name" autoComplete="off" />
          <FormField control={form.control} name="description" label="Description">
            {(field, control) => <Textarea rows={3} {...field} {...control} />}
          </FormField>
          <FormField
            control={form.control}
            name="output_language"
            label="Output language"
            description="The language the agents write the artifacts in."
          >
            {(field, control) => (
              <NativeSelect {...field} {...control}>
                {outputLanguages.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {outputLanguageLabels[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </FieldGroup>
        <SaveBar pending={update.isPending} error={update.formError} saved={update.isSuccess} />
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
