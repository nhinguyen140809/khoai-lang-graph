'use client'

import { useEffect, useRef } from 'react'

import { useIsProjectWriting } from '@/modules/project/entities'
import { useReloadTraces } from '@/modules/trace/entities'

/**
 * Reloads every query of the trace once, when the agents of the project stop writing: the pages
 * that follow the work while it goes turn their reload off then, and this brings the last state
 * in. While the agents never wrote, nothing reloads.
 */
export function useReloadTraceWhenAgentsStop(projectId: string) {
  const isWriting = useIsProjectWriting(projectId)
  const reloadTraces = useReloadTraces()
  const wasWriting = useRef(false)

  useEffect(() => {
    if (wasWriting.current && !isWriting) void reloadTraces()
    wasWriting.current = isWriting
  }, [isWriting, reloadTraces])
}
