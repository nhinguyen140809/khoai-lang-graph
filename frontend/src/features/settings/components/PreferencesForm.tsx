'use client'

import { useMemo, useState } from 'react'

import {
  parameterFields,
  type RunConfigDefinition,
  RunConfigFields,
  type RunForm,
  runFormOf,
  toRunConfig,
  validateRunForm,
} from '@/shared/components/run-config'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'

import { formErrorMessage } from '../form-errors.utils'
import { useSavePreferences } from '../hooks/useAccountQueries'
import type { UserSettings } from '../settings.types'
import { SaveBar } from './SaveBar'

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
  const save = useSavePreferences()
  const fields = useMemo(() => parameterFields(definition), [definition])
  const [theme, setTheme] = useState<string>(settings.theme)
  const [uiLanguage, setUiLanguage] = useState<string>(settings.ui_language)
  const [outputLanguage, setOutputLanguage] = useState<string>(settings.default_output_language)
  const [onInterrupt, setOnInterrupt] = useState(settings.notify_on_interrupt)
  const [onFinished, setOnFinished] = useState(settings.notify_on_run_finished)
  const [runForm, setRunForm] = useState<RunForm>(() => runFormOf(settings.default_run_config))
  const [problems, setProblems] = useState<Record<string, string>>({})

  return (
    <form
      noValidate
      aria-label="Preferences"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const found = validateRunForm(runForm, fields)
        setProblems(found)
        if (Object.keys(found).length > 0) return
        save.mutate({
          theme: themes.find(([value]) => value === theme)?.[0] ?? settings.theme,
          ui_language:
            languages.find(([value]) => value === uiLanguage)?.[0] ?? settings.ui_language,
          default_output_language:
            languages.find(([value]) => value === outputLanguage)?.[0] ??
            settings.default_output_language,
          default_run_config: toRunConfig(runForm, fields),
          notify_on_interrupt: onInterrupt,
          notify_on_run_finished: onFinished,
        })
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="pref-theme">Theme</FieldLabel>
          <NativeSelect
            id="pref-theme"
            value={theme}
            onChange={(event) => {
              setTheme(event.target.value)
            }}
          >
            {themes.map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="pref-ui-language">Language of the app</FieldLabel>
          <NativeSelect
            id="pref-ui-language"
            value={uiLanguage}
            onChange={(event) => {
              setUiLanguage(event.target.value)
            }}
          >
            {languages.map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="pref-output-language">Output language of new projects</FieldLabel>
          <NativeSelect
            id="pref-output-language"
            value={outputLanguage}
            onChange={(event) => {
              setOutputLanguage(event.target.value)
            }}
          >
            {languages.map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>The language the agents write the artifacts in.</FieldDescription>
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Notify me when</FieldLegend>
          <Field orientation="horizontal">
            <Checkbox
              id="notify-interrupt"
              checked={onInterrupt}
              onCheckedChange={(checked) => {
                setOnInterrupt(checked === true)
              }}
            />
            <FieldLabel htmlFor="notify-interrupt">A run waits for my review</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              id="notify-finished"
              checked={onFinished}
              onCheckedChange={(checked) => {
                setOnFinished(checked === true)
              }}
            />
            <FieldLabel htmlFor="notify-finished">A run has finished</FieldLabel>
          </Field>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Run settings of every project</FieldLegend>
          <FieldDescription>
            A project that leaves a field empty uses these. A field left empty here uses the default
            of the server.
          </FieldDescription>
          <RunConfigFields
            definition={definition}
            form={runForm}
            onChange={setRunForm}
            problems={problems}
            defaultLabel="Use the default of the server"
          />
        </FieldSet>
      </FieldGroup>
      <SaveBar
        pending={save.isPending}
        error={formErrorMessage(save.error)}
        saved={save.isSuccess}
      />
    </form>
  )
}
