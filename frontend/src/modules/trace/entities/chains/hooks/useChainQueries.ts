'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import type { HookQueryOptions } from '@/shared/api/query-client'

import type { LiveTraceOptions } from '../../live-trace.types'
import { traceModuleKeys } from '../../trace-module.keys'
import { getArtifactTrace, getItemTrace } from '../chains.api'
import { chainKeys } from '../chains.keys'
import type { LinkQuote, TraceQuery } from '../chains.types'
import { linkQuotesByItem, outOfDateItemIds } from '../chains.utils'

/** The chain of one item; `isEnabled` waits until it is needed, and a reload follows the agents while they write. */
export function useItemTrace(
  itemId: string,
  query: TraceQuery = {},
  { isEnabled = true, refetchInterval }: LiveTraceOptions = {},
) {
  return useQuery({
    queryKey: chainKeys.ofItem(itemId, query),
    queryFn: () => getItemTrace(itemId, query),
    enabled: isEnabled,
    refetchInterval: refetchInterval ?? false,
  })
}

/** The chains of all the items of an artifact; `isEnabled` waits until it is needed. */
export function useArtifactTrace(
  artifactId: string,
  query: TraceQuery = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: chainKeys.ofArtifact(artifactId, query),
    queryFn: () => getArtifactTrace(artifactId, query),
    enabled: isEnabled,
  })
}

/**
 * The items of an artifact that link to a target that moved on since: empty while the trace loads
 * or fails, since the `!` state is not worth an error of its own.
 */
export function useOutOfDateItemIds(artifactId: string): ReadonlySet<string> {
  const trace = useArtifactTrace(artifactId, { direction: 'backward', depth: 1 })
  return useMemo(
    () => (trace.data === undefined ? new Set<string>() : outOfDateItemIds(trace.data)),
    [trace.data],
  )
}

/**
 * The quoted words of the items of an artifact and of the items that link to them, such as the
 * quotes of each message of a transcript; a union with `state`, as `useItemLinks` gives, with
 * the quote of each link by its id.
 */
export function useLinkQuotesOf(
  artifactId: string,
  { isEnabled }: { isEnabled: boolean },
):
  | { state: 'pending' }
  | { state: 'error'; error: Error; retry: () => void }
  | {
      state: 'success'
      quotesByItem: ReadonlyMap<string, LinkQuote[]>
      /** The quote of each link, by its id, so a mark finds the entry of its card. */
      quotesByLinkId: ReadonlyMap<string, LinkQuote>
    } {
  const trace = useArtifactTrace(artifactId, { direction: 'forward', depth: 1 }, { isEnabled })
  if (trace.isError) {
    return { state: 'error', error: trace.error, retry: () => void trace.refetch() }
  }
  if (trace.data === undefined) return { state: 'pending' }
  const quotesByItem = linkQuotesByItem(trace.data)
  const quotesByLinkId = new Map(
    [...quotesByItem.values()].flat().map((quote) => [quote.link.id, quote]),
  )
  return { state: 'success', quotesByItem, quotesByLinkId }
}

/** Loads again every query of the traces, after an artifact or an item changed. */
export function useReloadTraces(): () => Promise<void> {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: traceModuleKeys.all() })
  }, [queryClient])
}
