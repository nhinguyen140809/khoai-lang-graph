import { apiUrl } from '@/lib/api-url.utils'

import { listThreadsResponseSchema, type Thread } from './threads.types'

// TODO: switch to the generated client in src/api/generated/ once the threads API exists.
export async function listThreads(): Promise<Thread[]> {
  const response = await fetch(apiUrl('/api/v1/threads'))
  if (!response.ok) {
    throw new Error(`Failed to load threads (HTTP ${String(response.status)})`)
  }
  return listThreadsResponseSchema.parse(await response.json()).items
}
