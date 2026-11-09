'use client'

import { useReloadTraceWhenAgentsStop } from './useReloadTraceWhenAgentsStop'

/**
 * The streams of Trace, mounted once by the layout of a project: it reloads the trace when the
 * agents stop writing, so that the panel, the chain and the pages show the state they left.
 */
export function TraceStreams({ projectId }: { projectId: string }) {
  useReloadTraceWhenAgentsStop(projectId)
  return null
}
