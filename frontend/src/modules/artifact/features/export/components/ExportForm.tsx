'use client'

import { LayersIcon } from 'lucide-react'
import { useId } from 'react'

import { type ExportTemplate, useKindTitles } from '@/modules/workflow/entities'
import { Form, FormFieldSet } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { DialogClose, DialogFooter } from '@/shared/components/ui/dialog'
import { FieldError, FieldGroup } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'

import { exportMessages } from '../export.constants'
import { exportContents } from '../export.utils'
import { useExportForm } from '../hooks/useExportForm'
import { ExportChoice } from './ExportChoices'

interface ExportFormProps {
  projectId: string
  templateKey: string
  templates: readonly ExportTemplate[]
  onOpenChange: (open: boolean) => void
}

/** The documents to export, each with the file type of its own, and the buttons. */
export function ExportForm({ projectId, templateKey, templates, onOpenChange }: ExportFormProps) {
  const id = useId()
  const exportForm = useExportForm(projectId, {
    templateKey,
    templates,
    onAsked: () => {
      onOpenChange(false)
    },
  })
  const kindTitles = useKindTitles()
  const isEvery = exportForm.chosenKeys.length === exportForm.listed.length

  return (
    <Form onSubmit={exportForm.submit} className="flex flex-col gap-6">
      <FieldGroup>
        {exportForm.all !== undefined && (
          <ExportChoice
            id={`${id}-all`}
            icon={<LayersIcon aria-hidden className="mt-0.5 size-4 text-muted-foreground" />}
            title={exportMessages.all}
            description={exportMessages.allHint}
            formats={exportForm.all.formats}
            format={exportForm.formats[exportForm.all.key]}
            isChecked={exportForm.isAll}
            isDisabled={exportForm.isPending}
            index={0}
            onCheckedChange={exportForm.chooseAll}
            onFormatChange={(format) => {
              if (exportForm.all !== undefined) exportForm.chooseFormat(exportForm.all.key, format)
            }}
          />
        )}
        <FormFieldSet
          control={exportForm.form.control}
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
              {exportForm.listed.map((template, index) => (
                <ExportChoice
                  key={template.key}
                  id={`${id}-template-${template.key}`}
                  title={template.title}
                  description={exportContents(template, kindTitles)}
                  formats={template.formats}
                  format={exportForm.formats[template.key]}
                  isChecked={exportForm.chosenKeys.includes(template.key)}
                  isDisabled={exportForm.isPending || exportForm.isAll}
                  index={index + 1}
                  onCheckedChange={(isChecked) => {
                    exportForm.toggleTemplate(template.key, isChecked)
                  }}
                  onFormatChange={(format) => {
                    exportForm.chooseFormat(template.key, format)
                  }}
                />
              ))}
            </div>
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
