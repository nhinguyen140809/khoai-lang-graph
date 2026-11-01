'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { CheckboxField, FormField, SaveBar } from '@/shared/components/form'
import {
  parameterFields,
  type RunConfigDefinition,
  RunConfigFields,
  runFormOf,
} from '@/shared/components/run-config'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/shared/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'

import { useSavePreferences } from '../hooks/useAccountQueries'
import { preferencesFormSchema } from '../settings.schema'
import type { UserSettings } from '../settings.types'

const themes = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'System'],
] as const

const languages = [
  ['en', 'English'],
  ['vi', 'Vietnamese'],
] as const

interface PreferencesFormProps {
  settings: UserSettings
  definition: RunConfigDefinition
}

/** The theme, the languages, the notifications and the run settings that every project starts from. */
export function PreferencesForm({ settings, definition }: PreferencesFormProps) {
  const fields = useMemo(() => parameterFields(definition), [definition])
  const schema = useMemo(() => preferencesFormSchema(fields), [fields])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      theme: settings.theme,
      ui_language: settings.ui_language,
      default_output_language: settings.default_output_language,
      notify_on_interrupt: settings.notify_on_interrupt,
      notify_on_run_finished: settings.notify_on_run_finished,
      default_run_config: runFormOf(settings.default_run_config, fields),
    },
  })
  const save = useSavePreferences(form.setError, schema)

  const onSubmit = form.handleSubmit((body) => {
    save.mutate(body)
  })

  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-label="Preferences"
        className="flex max-w-xl flex-col"
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FieldGroup>
          <FormField control={form.control} name="theme" label="Theme">
            {(field, control) => (
              <NativeSelect {...field} {...control}>
                {themes.map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={form.control} name="ui_language" label="Language of the app">
            {(field, control) => (
              <NativeSelect {...field} {...control}>
                {languages.map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField
            control={form.control}
            name="default_output_language"
            label="Output language of new projects"
            description="The language the agents write the artifacts in."
          >
            {(field, control) => (
              <NativeSelect {...field} {...control}>
                {languages.map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FieldSet>
            <FieldLegend variant="label">Notify me when</FieldLegend>
            <CheckboxField
              control={form.control}
              name="notify_on_interrupt"
              label="A run waits for my review"
            />
            <CheckboxField
              control={form.control}
              name="notify_on_run_finished"
              label="A run has finished"
            />
          </FieldSet>
          <FieldSet>
            <FieldLegend>Run settings of every project</FieldLegend>
            <FieldDescription>
              A project that leaves a field empty uses these. A field left empty here uses the
              default of the server.
            </FieldDescription>
            <RunConfigFields
              definition={definition}
              name="default_run_config"
              defaultLabel="Use the default of the server"
            />
          </FieldSet>
        </FieldGroup>
        <SaveBar pending={save.isPending} error={save.formError} saved={save.isSuccess} />
      </form>
    </FormProvider>
  )
}
