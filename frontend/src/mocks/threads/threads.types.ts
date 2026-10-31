import type { Thread } from '@/modules/thread/entities'

/** What a change of a thread may set: the store keeps these fields, the others are derived. */
export type ThreadEdit = Partial<Pick<Thread, 'title' | 'status' | 'updated_at'>>
