import type { APIRequestContext } from '@playwright/test'

const apiPrefix = '/api/v1'

/** What the API answered: its status, its body read as JSON (null when empty), and its headers. */
export interface ApiReply<Body = unknown> {
  status: number
  body: Body
  headers: Record<string, string>
}

type Query = Record<string, string | number | undefined>

interface SendOptions {
  query?: Query | undefined
  body?: unknown
  idempotencyKey?: string | undefined
}

/** The calls of the tests to the API, signed in as the page is, each one answered as an `ApiReply`. */
export interface ApiClient {
  get: <Body = unknown>(path: string, query?: Query) => Promise<ApiReply<Body>>
  post: <Body = unknown>(
    path: string,
    body?: unknown,
    options?: Pick<SendOptions, 'idempotencyKey'>,
  ) => Promise<ApiReply<Body>>
  put: <Body = unknown>(path: string, body?: unknown) => Promise<ApiReply<Body>>
  patch: <Body = unknown>(path: string, body?: unknown) => Promise<ApiReply<Body>>
  remove: <Body = unknown>(path: string) => Promise<ApiReply<Body>>
  /** Sends a form with one file, as the upload of a document does. */
  upload: <Body = unknown>(
    path: string,
    file: { name: string; mimeType: string; text: string },
    fields?: Record<string, string>,
  ) => Promise<ApiReply<Body>>
  /** Posts JSON to any address, outside the prefix of the API, such as the hooks of the demo server. */
  postTo: (address: string, body: unknown) => Promise<ApiReply>
  /** Reads a file at an address the API gave, `download_url` of an export, and gives its text. */
  download: (address: string) => Promise<ApiReply<string>>
}

/**
 * A client of the API over the requests of a test, which carry the cookies of the signed-in user.
 * A call that changes something names the origin of the app, as a browser does.
 */
export function apiClientOf(request: APIRequestContext, origin: string): ApiClient {
  async function send<Body>(
    method: string,
    path: string,
    { query, body, idempotencyKey }: SendOptions = {},
  ): Promise<ApiReply<Body>> {
    const params = Object.fromEntries(
      Object.entries(query ?? {}).filter(
        (entry): entry is [string, string | number] => entry[1] !== undefined,
      ),
    )
    const response = await request.fetch(`${apiPrefix}${path}`, {
      method,
      params,
      data: body,
      headers: {
        Origin: origin,
        ...(idempotencyKey === undefined ? {} : { 'Idempotency-Key': idempotencyKey }),
      },
    })
    const text = await response.text()
    return {
      status: response.status(),
      body: (text === '' ? null : JSON.parse(text)) as Body,
      headers: response.headers(),
    }
  }

  return {
    get: (path, query) => send('GET', path, { query }),
    post: (path, body, options) => send('POST', path, { body, ...options }),
    put: (path, body) => send('PUT', path, { body }),
    patch: (path, body) => send('PATCH', path, { body }),
    remove: (path) => send('DELETE', path),
    upload: async (path, file, fields = {}) => {
      const response = await request.fetch(`${apiPrefix}${path}`, {
        method: 'POST',
        multipart: {
          ...fields,
          file: { name: file.name, mimeType: file.mimeType, buffer: Buffer.from(file.text) },
        },
        headers: { Origin: origin },
      })
      const text = await response.text()
      return {
        status: response.status(),
        body: (text === '' ? null : JSON.parse(text)) as never,
        headers: response.headers(),
      }
    },
    postTo: async (address, body) => {
      const response = await request.fetch(address, {
        method: 'POST',
        data: body,
        headers: { Origin: origin },
      })
      const text = await response.text()
      return {
        status: response.status(),
        body: text === '' ? null : JSON.parse(text),
        headers: response.headers(),
      }
    },
    download: async (address) => {
      const response = await request.fetch(address, { headers: { Origin: origin } })
      return { status: response.status(), body: await response.text(), headers: response.headers() }
    },
  }
}
