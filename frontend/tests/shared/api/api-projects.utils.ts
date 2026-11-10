import type { ApiClient } from './api-client.utils'
import { type ApiPage, expectCreated, expectPage } from './api-responses.utils'

export interface ApiProject {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
}

export interface ApiThread {
  id: string
  title: string
  status: 'active' | 'archived'
}

export interface ApiDocument {
  id: string
  title: string
  versions?: { id: string; version: number }[]
  /** The text of the version that was read. */
  text?: string
}

/** The projects of the user with this status, as the list shows them. */
export async function listProjects(
  api: ApiClient,
  status: 'active' | 'archived' = 'active',
): Promise<ApiProject[]> {
  return expectPage(await api.get<ApiPage<ApiProject>>('/projects', { status, limit: 200 })).items
}

/** The reply to a change of a project, as it is. */
export function updateProject(api: ApiClient, projectId: string, changes: Partial<ApiProject>) {
  return api.patch<ApiProject>(`/projects/${projectId}`, changes)
}

/** The reply to the removal of a project, as it is. */
export function deleteProject(api: ApiClient, projectId: string) {
  return api.remove(`/projects/${projectId}`)
}

/** The threads of a project. */
export async function listThreads(api: ApiClient, projectId: string): Promise<ApiThread[]> {
  return expectPage(
    await api.get<ApiPage<ApiThread>>(`/projects/${projectId}/threads`, { limit: 200 }),
  ).items
}

/** The reply to a change of a thread, as it is. */
export function updateThread(api: ApiClient, threadId: string, changes: Partial<ApiThread>) {
  return api.patch<ApiThread>(`/threads/${threadId}`, changes)
}

/** The reply to the removal of a thread, as it is. */
export function deleteThread(api: ApiClient, threadId: string) {
  return api.remove(`/threads/${threadId}`)
}

/** Uploads a text document to the project and gives it as the API answers. */
export async function uploadDocument(
  api: ApiClient,
  projectId: string,
  name: string,
  text: string,
  fields: Record<string, string> = {},
): Promise<ApiDocument> {
  return expectCreated(
    await api.upload<ApiDocument>(
      `/projects/${projectId}/documents`,
      { name, mimeType: 'text/plain', text },
      fields,
    ),
  )
}

/** The documents of a project, the newest first. */
export async function listDocuments(api: ApiClient, projectId: string): Promise<ApiDocument[]> {
  return expectPage(
    await api.get<ApiPage<ApiDocument>>(`/projects/${projectId}/documents`, { limit: 200 }),
  ).items
}

/** The reply to the removal of a document, as it is. */
export function deleteDocument(api: ApiClient, documentId: string) {
  return api.remove(`/documents/${documentId}`)
}
