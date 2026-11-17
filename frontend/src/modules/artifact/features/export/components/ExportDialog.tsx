'use client'

import { useId } from 'react'

import {
  exportFormatLabels,
  type ExportTemplate,
  useWorkflowDefinition,
} from '@/modules/workflow/entities'
import { Form, FormFieldSet } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'

import { exportMessages } from '../export.constants'
import { useIsExporting } from '../hooks/useCreateExport'
import { useExportForm } from '../hooks/useExportForm'
import { useExportDialog } from '../hooks/useOpenExportDialog'

/**
 * Asks which document and which format to export: one on the screen, mounted by `ExportDialogs`
 * and opened with a template. While the request is pending it does not close, so that an export
 * never starts behind a dialog that the user closed.
 */
export function ExportDialog({ projectId }: { projectId: string }) {
  const dialog = useExportDialog()
  const { data: definition } = useWorkflowDefinition()
  const isExporting = useIsExporting()

  if (dialog.targetId === null || definition === undefined) return null

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!isExporting) dialog.setOpen(open)
      }}
    >
      {/* The title says it all: a description would only repeat the button. */}
      <DialogContent size="md" aria-describedby={undefined} onCloseAutoFocus={dialog.closed}>
        <DialogHeader>
          <DialogTitle>{exportMessages.dialogTitle}</DialogTitle>
        </DialogHeader>
        <ExportForm
          key={dialog.targetId}
          projectId={projectId}
          templateKey={dialog.targetId}
          templates={definition.export_templates}
          onOpenChange={dialog.setOpen}
        />
      </DialogContent>
    </Dialog>
  )
}

interface ExportFormProps {
  projectId: string
  templateKey: string
  templates: readonly ExportTemplate[]
  onOpenChange: (open: boolean) => void
}

/** The documents to export, the formats of the chosen one, and the buttons. */
function ExportForm({ projectId, templateKey, templates, onOpenChange }: ExportFormProps) {
  const id = useId()
  const exportForm = useExportForm(projectId, {
    templateKey,
    templates,
    onAsked: () => {
      onOpenChange(false)
    },
  })
  const { control } = exportForm.form

  return (
    <Form onSubmit={exportForm.submit} className="flex flex-col gap-6">
      <FieldGroup>
        <FormFieldSet control={control} name="template" legend={exportMessages.template}>
          {(field) => (
            <RadioGroup
              value={field.value}
              disabled={exportForm.isPending}
              onValueChange={exportForm.chooseTemplate}
            >
              {templates.map((template) => (
                <Field key={template.key} orientation="horizontal">
                  <RadioGroupItem id={`${id}-template-${template.key}`} value={template.key} />
                  <FieldLabel htmlFor={`${id}-template-${template.key}`}>
                    {template.title}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          )}
        </FormFieldSet>
        <FormFieldSet control={control} name="format" legend={exportMessages.format}>
          {(field) => (
            <RadioGroup
              value={field.value}
              disabled={exportForm.isPending}
              onValueChange={field.onChange}
            >
              {exportForm.formats.map((format) => (
                <Field key={format} orientation="horizontal">
                  <RadioGroupItem id={`${id}-format-${format}`} value={format} />
                  <FieldLabel htmlFor={`${id}-format-${format}`}>
                    {exportFormatLabels[format]}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          )}
        </FormFieldSet>
        <FieldError>{exportForm.formError}</FieldError>
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={exportForm.isPending}>
            {exportMessages.cancel}
          </Button>
        </DialogClose>
        <PendingButton
          type="submit"
          pending={exportForm.isPending}
          pendingLabel={exportMessages.submitting}
        >
          {exportMessages.submit}
        </PendingButton>
      </DialogFooter>
    </Form>
  )
}
