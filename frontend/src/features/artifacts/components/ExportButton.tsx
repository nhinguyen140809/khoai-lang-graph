'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { DownloadIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { FormField } from '@/shared/components/form'
import { ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Spinner } from '@/shared/components/ui/spinner'
import { RouteParam } from '@/shared/config/routes'

import { exportFormSchema } from '../artifacts.schema'
import type { DefinitionSummary } from '../artifacts.types'
import { useDefinitionSummary } from '../hooks/useDefinitionSummary'
import { useExport } from '../hooks/useExport'

interface ExportButtonProps {
  projectId: string
  /** Opens the dialog when the address of the page asks for an export with `?export`. */
  openFromAddress?: boolean
}

/** A button that asks for a document made from the artifacts: a template and a format. */
export function ExportButton({ projectId, openFromAddress = false }: ExportButtonProps) {
  const searchParams = useSearchParams()
  const asked = openFromAddress && searchParams.has(RouteParam.Export)
  const [open, setOpen] = useState(asked)
  // The side panel can be on screen before the address asks for the export, as after the /export
  // command of the console, so the dialog also opens when the address starts to ask.
  const [askedBefore, setAskedBefore] = useState(asked)
  if (asked !== askedBefore) {
    setAskedBefore(asked)
    if (asked) setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs">
          <DownloadIcon aria-hidden />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Make a document from the artifacts of the project, as they are now.
          </DialogDescription>
        </DialogHeader>
        {open && <ExportForm projectId={projectId} />}
      </DialogContent>
    </Dialog>
  )
}

function ExportForm({ projectId }: { projectId: string }) {
  const definition = useDefinitionSummary()

  if (definition.isPending)
    return <LoadingState label="Loading the templates" rows={2} size="compact" />
  if (definition.isError) {
    return (
      <ErrorState
        message={definition.error.message}
        onRetry={() => void definition.refetch()}
        size="compact"
      />
    )
  }
  return <ExportFields projectId={projectId} templates={definition.data.export_templates} />
}

interface ExportFieldsProps {
  projectId: string
  templates: DefinitionSummary['export_templates']
}

function ExportFields({ projectId, templates }: ExportFieldsProps) {
  const formatsOf = (template: string) =>
    templates.find(({ key }) => key === template)?.formats ?? []
  const form = useForm({
    resolver: zodResolver(exportFormSchema),
    defaultValues: { template: templates[0]?.key ?? '', format: templates[0]?.formats[0] ?? '' },
  })
  const { asked, exported } = useExport(projectId, form.setError)
  const formats = formatsOf(useWatch({ control: form.control, name: 'template' }))
  const result = exported.data

  const onSubmit = form.handleSubmit((body) => {
    asked.mutate(body)
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FormField control={form.control} name="template" label="Template">
        {(field, control) => (
          <Select
            value={field.value}
            onValueChange={(template) => {
              field.onChange(template)
              // A format that the new template lacks gives way to the first one it has.
              const next = formatsOf(template)
              if (!next.includes(form.getValues('format'))) form.setValue('format', next[0] ?? '')
            }}
          >
            <SelectTrigger {...control} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map(({ key, label }) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormField control={form.control} name="format" label="Format">
        {(field, control) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger {...control} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      {asked.formError !== null && (
        <p role="alert" className="text-sm text-destructive-strong">
          {asked.formError}
        </p>
      )}

      {result?.status === 'pending' && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Making {result.file_name}...
        </p>
      )}
      {result?.status === 'failed' && (
        <p role="alert" className="text-sm text-destructive-strong">
          The export failed. Try again.
        </p>
      )}
      {result?.status === 'ready' && result.download_url !== null && (
        <Button asChild>
          <a href={result.download_url} download={result.file_name}>
            <DownloadIcon aria-hidden />
            Download {result.file_name}
          </a>
        </Button>
      )}

      <Button
        type="submit"
        disabled={asked.isPending}
        variant={result?.status === 'ready' ? 'outline' : 'default'}
      >
        {asked.isPending && <Spinner className="size-4" />}
        {result === undefined ? 'Export' : 'Export again'}
      </Button>
    </form>
  )
}
