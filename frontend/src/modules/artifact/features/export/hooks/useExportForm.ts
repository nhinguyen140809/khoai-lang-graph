import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import type { ExportFormat, ExportTemplate } from '@/modules/workflow/entities'
import { newIdempotencyKey } from '@/shared/api/idempotency'

import { exportAllTemplateKey } from '../export.constants'
import { exportFormSchema } from '../export.schema'
import { exportBodiesOf, startFormatsOf } from '../export.utils'
import { useCreateExport } from './useCreateExport'

interface ExportFormOptions {
  /** The key of the template that the form starts on; all the documents when it is theirs. */
  templateKey: string
  templates: readonly ExportTemplate[]
  /** Runs once the exports are asked for. */
  onAsked: () => void
}

/**
 * The form of an export: the documents to export, all of them in one file or the ones chosen, and
 * the file type of each, which starts on the first that the document offers. The submit asks for
 * one export for each file, each with a new key for each press.
 */
export function useExportForm(
  projectId: string,
  { templateKey, templates, onAsked }: ExportFormOptions,
) {
  const all = templates.find(({ key }) => key === exportAllTemplateKey)
  const listed = templates.filter(({ key }) => key !== exportAllTemplateKey)
  const isStartingOnAll = templateKey === exportAllTemplateKey && all !== undefined
  const first = listed.find(({ key }) => key === templateKey) ?? listed[0]
  const form = useForm({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      isAll: isStartingOnAll,
      templates: isStartingOnAll || first === undefined ? [] : [first.key],
      formats: startFormatsOf(templates),
    },
  })
  const isAll = useWatch({ control: form.control, name: 'isAll' })
  const chosenKeys = useWatch({ control: form.control, name: 'templates' })
  const formats = useWatch({ control: form.control, name: 'formats' })
  const create = useCreateExport(projectId, { setError: form.setError, onAsked, templates })

  const choose = (isNextAll: boolean, keys: string[]) => {
    form.setValue('isAll', isNextAll)
    form.setValue('templates', keys)
    form.clearErrors('templates')
  }

  return {
    form,
    listed,
    all,
    isAll,
    chosenKeys,
    formats,
    chooseAll: () => {
      choose(!isAll, chosenKeys)
    },
    toggleTemplate: (key: string, isChecked: boolean) => {
      choose(
        false,
        isChecked ? [...chosenKeys, key] : chosenKeys.filter((chosenKey) => chosenKey !== key),
      )
    },
    selectEvery: (isEvery: boolean) => {
      choose(false, isEvery ? listed.map(({ key }) => key) : [])
    },
    chooseFormat: (key: string, format: ExportFormat) => {
      form.setValue(`formats.${key}`, format)
    },
    submit: form.handleSubmit((values) => {
      create.mutate(
        exportBodiesOf(values).map((body) => ({ body, idempotencyKey: newIdempotencyKey() })),
      )
    }),
    isPending: create.isPending,
    formError: create.formError,
  }
}
