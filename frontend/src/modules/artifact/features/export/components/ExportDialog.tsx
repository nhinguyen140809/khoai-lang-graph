'use client'

import { CheckIcon, LayersIcon } from 'lucide-react'
import { useId } from 'react'

import {
  type ExportFormat,
  exportFormatLabels,
  type ExportTemplate,
  useKindTitles,
  useWorkflowDefinition,
} from '@/modules/workflow/entities'
import { Form, FormFieldSet } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'

import { exportFormatLooks, exportMessages } from '../export.constants'
import { exportContents } from '../export.utils'
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
  const kindTitles = useKindTitles()
  const isEvery = exportForm.chosenKeys.length === exportForm.listed.length

  return (
    <Form onSubmit={exportForm.submit} className="flex flex-col gap-6">
      <FieldGroup>
        <AllDocumentsButton
          isOn={exportForm.isAll}
          isDisabled={exportForm.isPending}
          onClick={exportForm.chooseAll}
        />
        <FormFieldSet
          control={control}
          name="templates"
          legend={exportMessages.template}
          description={exportMessages.templateHint}
          action={() => (
            <Button
              type="button"
              variant="link"
              size="xs"
              disabled={exportForm.isPending || exportForm.isAll}
              onClick={() => {
                exportForm.selectEvery(!isEvery)
              }}
            >
              {isEvery ? exportMessages.clearAll : exportMessages.selectAll}
            </Button>
          )}
        >
          {() => (
            <div className="grid gap-2">
              {exportForm.listed.map((template) => (
                <TemplateChoice
                  key={template.key}
                  id={`${id}-template-${template.key}`}
                  template={template}
                  contents={exportContents(template, kindTitles)}
                  isChecked={exportForm.chosenKeys.includes(template.key)}
                  isDisabled={exportForm.isPending || exportForm.isAll}
                  onCheckedChange={(isChecked) => {
                    exportForm.toggleTemplate(template.key, isChecked)
                  }}
                />
              ))}
            </div>
          )}
        </FormFieldSet>
        <FormFieldSet
          control={control}
          name="format"
          legend={exportMessages.format}
          description={
            exportForm.formats.length === 0
              ? exportMessages.noCommonFormat
              : exportMessages.formatHint
          }
        >
          {(field) => (
            <RadioGroup
              value={field.value}
              disabled={exportForm.isPending}
              onValueChange={field.onChange}
              className="grid-cols-3"
            >
              {exportForm.formats.map((format) => (
                <FormatChoice key={format} id={`${id}-format-${format}`} format={format} />
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

/** The button that exports all the documents in one file: it stands apart from the list, and turns the list off while it is on. */
function AllDocumentsButton({
  isOn,
  isDisabled,
  onClick,
}: {
  isOn: boolean
  isDisabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={isOn}
      disabled={isDisabled}
      onClick={onClick}
      className="h-auto justify-start gap-3 px-3 py-2.5 text-left aria-pressed:border-primary/30 aria-pressed:bg-primary/5"
    >
      <LayersIcon aria-hidden className="text-muted-foreground" />
      <span className="flex flex-col items-start">
        <span className="font-medium">{exportMessages.all}</span>
        <span className="text-xs font-normal text-muted-foreground">{exportMessages.allHint}</span>
      </span>
      {isOn && <CheckIcon aria-hidden className="ml-auto text-primary" />}
    </Button>
  )
}

/** A document to export as a card: its title, what it holds, and the checkbox at its end. */
function TemplateChoice({
  id,
  template,
  contents,
  isChecked,
  isDisabled,
  onCheckedChange,
}: {
  id: string
  template: ExportTemplate
  contents: string
  isChecked: boolean
  isDisabled: boolean
  onCheckedChange: (isChecked: boolean) => void
}) {
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal" data-disabled={isDisabled}>
        <FieldContent>
          <FieldTitle id={`${id}-title`}>{template.title}</FieldTitle>
          <FieldDescription id={`${id}-contents`}>{contents}</FieldDescription>
        </FieldContent>
        <Checkbox
          id={id}
          checked={isChecked}
          disabled={isDisabled}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-contents`}
          onCheckedChange={(next) => {
            onCheckedChange(next === true)
          }}
        />
      </Field>
    </FieldLabel>
  )
}

/** A file type as a card: its icon, its name, and what it is for, with the radio at its corner. */
function FormatChoice({ id, format }: { id: string; format: ExportFormat }) {
  const { icon: Icon, hint } = exportFormatLooks[format]

  return (
    <FieldLabel htmlFor={id}>
      <Field>
        <div className="flex items-center justify-between">
          <Icon aria-hidden className="size-5 text-muted-foreground" />
          <RadioGroupItem
            id={id}
            value={format}
            aria-labelledby={`${id}-name`}
            aria-describedby={`${id}-hint`}
          />
        </div>
        <FieldContent>
          <FieldTitle id={`${id}-name`}>{exportFormatLabels[format]}</FieldTitle>
          <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}
