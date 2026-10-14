import { useMutation, useQuery } from '@tanstack/react-query'

import { createExport, getExport } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

/**
 * Asks for a document made from the artifacts of the project, with a template and a format, and
 * follows it until its file is made: `asked` sends the request, `exported` holds the export.
 */
export function useExport(projectId: string) {
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
  return { asked, exported }
}
