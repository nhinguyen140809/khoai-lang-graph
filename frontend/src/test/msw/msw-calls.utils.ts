import { HttpHeader, HttpMethod, MediaType } from '@/shared/api/http'
import { apiUrl } from '@/shared/api/request'
import { isString } from '@/shared/lib/guards'

import type { ApiAnswer, ApiCall } from './msw-calls.types'

/** Sends a request as `fetch` takes it and reads the answer: its status, headers and JSON body (null when empty). */
export async function fetchApi(path: string, init?: RequestInit): Promise<ApiAnswer> {
  const response = await fetch(apiUrl(path), init)
  const text = await response.text()
  const body: unknown = text === '' ? null : JSON.parse(text)
  return { status: response.status, headers: response.headers, body }
}

/**
 * Sends the call and reads the answer as `fetchApi` does. A body is sent as JSON, except a text,
 * which is sent as it is, so that a test can also send what is not JSON.
 */
export async function callApi({ method, path, body, headers = {} }: ApiCall) {
  return fetchApi(path, {
    method,
    headers:
      body === undefined ? headers : { [HttpHeader.ContentType]: MediaType.Json, ...headers },
    ...(body !== undefined && { body: isString(body) ? body : JSON.stringify(body) }),
  })
}

/** The JSON body of a GET, as the type that the test expects it to have. */
export async function getApi<T>(path: string): Promise<T> {
  return (await callApi({ method: HttpMethod.Get, path })).body as T
}

/** The items of one page of a list endpoint. */
export async function getApiItems<T>(path: string): Promise<T[]> {
  return (await getApi<{ items: T[] }>(path)).items
}

/** A POST with a body, as `callApi` sends it, with the headers given. */
export function postApi(path: string, body?: unknown, headers?: Record<string, string>) {
  return callApi({ method: HttpMethod.Post, path, body, ...(headers && { headers }) })
}

/** A PUT with a body, as `callApi` sends it. */
export function putApi(path: string, body?: unknown) {
  return callApi({ method: HttpMethod.Put, path, body })
}

/** A PATCH with a body, as `callApi` sends it. */
export function patchApi(path: string, body?: unknown) {
  return callApi({ method: HttpMethod.Patch, path, body })
}

/** A DELETE, with the headers given. */
export function deleteApi(path: string, headers?: Record<string, string>) {
  return callApi({ method: HttpMethod.Delete, path, ...(headers && { headers }) })
}
