import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest, fetchPage, type ListPage } from '@/shared/api/request'

import { type CreateExportBody, type Export, exportSchema } from '../types/exports.types'

/** Asks for an export of the artifacts of a project; a repeat with the same key asks for no second one. */
export function createExport(
  projectId: string,
  body: CreateExportBody,
  idempotencyKey: string,
): Promise<Export> {
  return apiRequest(apiEndpoints.projectExports.path({ projectId }), exportSchema, {
    action: 'ask for the export',
    method: HttpMethod.Post,
    body,
    idempotencyKey,
  })
}

export function listProjectExports(
  projectId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Export>> {
  return fetchPage(apiEndpoints.projectExports.path({ projectId }), exportSchema, {
    cursor,
    limit,
    action: 'load the exports',
  })
}

export function getExport(exportId: string): Promise<Export> {
  return apiRequest(apiEndpoints.exportEntry.path({ exportId }), exportSchema, {
    action: 'load the export',
  })
}
