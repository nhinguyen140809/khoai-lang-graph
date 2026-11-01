import { useMutation, useQuery } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'

import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { createExport, getExport } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'
import { type ExportForm, exportFormSchema } from '../artifacts.schema'

/**
 * Asks for a document made from the artifacts of the project, with a template and a format, and
 * follows it until its file is made: `asked` sends the request, `exported` holds the export. The
 * problems of the API show at the fields of the form, and `asked.formError` holds any other failure.
 */
export function useExport(projectId: string, setError: UseFormSetError<ExportForm>) {
  const asked = useMutation({
    mutationFn: ({ template, format }: ExportForm) => createExport(projectId, template, format),
    onError: (error) => {
      showFieldProblems(setError, error, exportFormSchema)
    },
  })
  const exported = useQuery({
    queryKey: artifactKeys.export(asked.data?.id ?? ''),
    queryFn: () => getExport(asked.data?.id ?? ''),
    enabled: asked.data !== undefined,
    // Ask again until the file is made.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 600 : false),
    initialData: asked.data,
  })
  return { asked: { ...asked, formError: formErrorOf(asked.error, exportFormSchema) }, exported }
}
