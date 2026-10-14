import { z } from 'zod'

import { apiUrl } from '@/shared/api/api-url.utils'

import { type Thread, threadSchema } from './threads.types'

// The first page of the threads; later pages are not read.
const listThreadsResponseSchema = z.object({ items: z.array(threadSchema) })

// TODO: switch to the generated client in src/shared/api/generated/ once the threads API exists.
export async function listThreads(): Promise<Thread[]> {
  const response = await fetch(apiUrl('/api/v1/threads'))
  if (!response.ok) {
    throw new Error(`Failed to load threads (HTTP ${String(response.status)})`)
  }
  return listThreadsResponseSchema.parse(await response.json()).items
}
