import type { TraceLink } from '@/modules/trace/entities'

import { mockState } from '../shared/db'

// What the mock server changes about the trace links while the app runs. The fixtures never change.

/** The links that the user made, as they were made. */
export const createdTraceLinks = mockState<TraceLink[]>('created-trace-links', () => [])
/** The ids of the links, of the fixtures or made since, that the user removed. */
export const deletedTraceLinkIds = mockState<string[]>('deleted-trace-link-ids', () => [])
