import type { Thread } from '@/modules/thread/entities'

import { mockState } from '../shared/db/mock-state.utils'

// Threads created with POST /projects/{project_id}/threads.
export const createdThreads = mockState<Thread[]>('created-threads', () => [])
