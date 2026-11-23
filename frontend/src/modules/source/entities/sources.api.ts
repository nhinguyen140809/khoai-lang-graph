import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiCommand, apiRequest, fetchPage, type ListPage } from '@/shared/api/request'

import { type Source, sourceSchema } from './sources.types'

/** Uploads one file as a source of the project; the server reads its text and the next runs quote it. */
export function uploadSource(projectId: string, file: File): Promise<Source> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest(apiEndpoints.projectSources.path({ projectId }), sourceSchema, {
    action: 'upload the source',
    method: HttpMethod.Post,
    body: form,
  })
}

/**
 * Uploads files as sources of the project, one after the other. A file that fails does not hold
 * back the rest; the files that did not go up are what it gives back, so that they can be sent again.
 */
export async function uploadSources(projectId: string, files: readonly File[]): Promise<File[]> {
  const failed: File[] = []
  for (const file of files) {
    try {
      await uploadSource(projectId, file)
    } catch {
      failed.push(file)
    }
  }
  return failed
}

export function listProjectSources(
  projectId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Source>> {
  return fetchPage(apiEndpoints.projectSources.path({ projectId }), sourceSchema, {
    cursor,
    limit,
    action: 'load the sources',
  })
}

export function getSource(sourceId: string): Promise<Source> {
  return apiRequest(apiEndpoints.sourceEntry.path({ documentId: sourceId }), sourceSchema, {
    action: 'load the source',
  })
}

/** Removes a source from the lists; its versions stay readable. */
export function deleteSource(sourceId: string): Promise<void> {
  return apiCommand(apiEndpoints.sourceEntry.path({ documentId: sourceId }), {
    action: 'delete the source',
    method: HttpMethod.Delete,
  })
}
