'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { DownloadIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { ErrorState, LoadingState } from '@/components/state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

import { createExport, getExport } from '../artifacts.api'
import { artifactKeys } from '../artifacts-keys.constants'
import { useDefinitionSummary } from '../hooks/useDefinitionSummary'

interface ExportButtonProps {
  projectId: string
  /** Opens the dialog when the address of the page asks for an export with `?export`. */
  openFromAddress?: boolean
}

/** A button that asks for a document made from the artifacts: a template and a format. */
export function ExportButton({ projectId, openFromAddress = false }: ExportButtonProps) {
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(openFromAddress && searchParams.has('export'))

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
  const [template, setTemplate] = useState<string | null>(null)
  const [format, setFormat] = useState<string | null>(null)

  const asked = useMutation({
    mutationFn: ({ key, chosen }: { key: string; chosen: string }) =>
      createExport(projectId, key, chosen),
  })
  const exported = useQuery({
    queryKey: artifactKeys.export(asked.data?.id ?? ''),
    queryFn: () => getExport(asked.data?.id ?? ''),
    enabled: asked.data !== undefined,
    // Ask again until the file is made.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 600 : false),
    initialData: asked.data,
  })

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

  const chosenTemplate =
    definition.data.export_templates.find(({ key }) => key === template) ??
    definition.data.export_templates[0]
  const formats = chosenTemplate?.formats ?? []
  const chosenFormat = format !== null && formats.includes(format) ? format : formats[0]
  const result = exported.data

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="export-template">Template</FieldLabel>
        <Select value={chosenTemplate?.key ?? ''} onValueChange={setTemplate}>
          <SelectTrigger id="export-template" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {definition.data.export_templates.map(({ key, label }) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="export-format">Format</FieldLabel>
        <Select value={chosenFormat ?? ''} onValueChange={setFormat}>
          <SelectTrigger id="export-format" className="w-full">
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
      </Field>

      {asked.isError && (
        <p role="alert" className="text-sm text-destructive-strong">
          {asked.error.message}
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
        disabled={chosenTemplate === undefined || chosenFormat === undefined || asked.isPending}
        variant={result?.status === 'ready' ? 'outline' : 'default'}
        onClick={() => {
          if (chosenTemplate !== undefined && chosenFormat !== undefined) {
            asked.mutate({ key: chosenTemplate.key, chosen: chosenFormat })
          }
        }}
      >
        {asked.isPending && <Spinner className="size-4" />}
        {result === undefined ? 'Export' : 'Export again'}
      </Button>
    </div>
  )
}
