import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import type { ExportTemplate } from '@/modules/workflow/entities'
import { newIdempotencyKey } from '@/shared/api/idempotency'

import { exportFormSchema } from '../export.schema'
import { useCreateExport } from './useCreateExport'

interface ExportFormOptions {
  /** The key of the template that the form starts on; the first template when the definition lacks it. */
  templateKey: string
  templates: readonly ExportTemplate[]
  /** Runs once the export is asked for. */
  onAsked: () => void
}

/**
 * The form of an export: the template, with the first of its formats, the formats of the chosen
 * template, the choice of another template, which chooses its first format, and the submit, which
 * asks for the export with a new key for each press.
 */
export function useExportForm(
  projectId: string,
  { templateKey, templates, onAsked }: ExportFormOptions,
) {
  const initial = templates.find(({ key }) => key === templateKey) ?? templates[0]
  const form = useForm({
    resolver: zodResolver(exportFormSchema),
    defaultValues: { template: initial?.key ?? '', format: initial?.formats[0] ?? 'markdown' },
  })
  const chosenKey = useWatch({ control: form.control, name: 'template' })
  const chosen = templates.find(({ key }) => key === chosenKey)
  const create = useCreateExport(projectId, { setError: form.setError, onAsked, templates })

  return {
    form,
    formats: chosen?.formats ?? [],
    chooseTemplate: (key: string) => {
      form.setValue('template', key)
      const formats = templates.find((template) => template.key === key)?.formats ?? []
      const [first] = formats
      if (first !== undefined) form.setValue('format', first)
    },
    submit: form.handleSubmit((values) => {
      create.mutate({ body: values, idempotencyKey: newIdempotencyKey() })
    }),
    isPending: create.isPending,
    formError: create.formError,
  }
}
