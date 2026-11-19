import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import type { ExportFormat, ExportTemplate } from '@/modules/workflow/entities'
import { newIdempotencyKey } from '@/shared/api/idempotency'

import { exportAllTemplateKey } from '../export.constants'
import { exportFormSchema } from '../export.schema'
import { commonFormats, exportBodiesOf } from '../export.utils'
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
 * the file types that every one of them offers. A change of the documents keeps the file type
 * while they still offer it and takes the first one otherwise. The submit asks for one export for
 * each file, each with a new key for each press.
 */
export function useExportForm(
  projectId: string,
  { templateKey, templates, onAsked }: ExportFormOptions,
) {
  const all = templates.find(({ key }) => key === exportAllTemplateKey)
  const listed = templates.filter(({ key }) => key !== exportAllTemplateKey)
  const isStartingOnAll = templateKey === exportAllTemplateKey && all !== undefined
  const first = listed.find(({ key }) => key === templateKey) ?? listed[0]
  const startTemplates = isStartingOnAll || first === undefined ? [] : [first]
  const form = useForm({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      isAll: isStartingOnAll,
      templates: startTemplates.map(({ key }) => key),
      format: (isStartingOnAll ? all : first)?.formats[0] ?? 'markdown',
    },
  })
  const isAll = useWatch({ control: form.control, name: 'isAll' })
  const chosenKeys = useWatch({ control: form.control, name: 'templates' })
  const create = useCreateExport(projectId, { setError: form.setError, onAsked, templates })

  const chosen = listed.filter(({ key }) => chosenKeys.includes(key))
  const formats: ExportFormat[] = isAll ? (all?.formats.slice() ?? []) : commonFormats(chosen)

  /** Chooses the documents and keeps the file type if they still offer it. */
  const choose = (isNextAll: boolean, keys: string[]) => {
    form.setValue('isAll', isNextAll)
    form.setValue('templates', keys)
    const offered = isNextAll
      ? (all?.formats ?? [])
      : commonFormats(listed.filter(({ key }) => keys.includes(key)))
    const [firstOffered] = offered
    if (firstOffered !== undefined && !offered.includes(form.getValues('format'))) {
      form.setValue('format', firstOffered)
    }
    form.clearErrors('templates')
  }

  return {
    form,
    listed,
    all,
    isAll,
    formats,
    chosenKeys,
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
    submit: form.handleSubmit((values) => {
      create.mutate(
        exportBodiesOf(values).map((body) => ({ body, idempotencyKey: newIdempotencyKey() })),
      )
    }),
    isPending: create.isPending,
    formError: create.formError,
  }
}
