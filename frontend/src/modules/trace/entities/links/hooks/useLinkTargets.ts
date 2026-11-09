'use client'

import { useQueries } from '@tanstack/react-query'

import { listProjectItems } from '@/modules/artifact/entities/@x/trace'

import { linkTargetsPageSize } from '../trace-links.constants'
import { traceLinkKeys } from '../trace-links.keys'

/**
 * The items that a link of the given kinds may lead to, the first page of each kind searched by
 * the words of the title or by the key, without the item the link starts from: at most
 * `linkTargetsPageSize` of them, by key order. No kind at all searches every kind, for a type of
 * link that names none.
 */
export function useLinkTargets(
  projectId: string,
  {
    kinds,
    text,
    excludeId,
    isEnabled = true,
  }: { kinds: readonly string[]; text: string; excludeId: string; isEnabled?: boolean },
) {
  const searchedKinds: readonly (string | null)[] = kinds.length === 0 ? [null] : kinds
  return useQueries({
    queries: searchedKinds.map((kind) => ({
      queryKey: traceLinkKeys.targets(projectId, { kind, text }),
      queryFn: () =>
        listProjectItems(projectId, null, linkTargetsPageSize, {
          kind: kind ?? undefined,
          text,
        }),
      enabled: isEnabled,
    })),
    combine: (pages) => ({
      items: [
        ...new Map(
          pages.flatMap((page) => page.data?.items ?? []).map((item) => [item.id, item]),
        ).values(),
      ]
        .filter((item) => item.id !== excludeId)
        .toSorted((a, b) => a.key.localeCompare(b.key))
        .slice(0, linkTargetsPageSize),
      isPending: pages.some((page) => page.isPending),
      isError: pages.some((page) => page.isError),
    }),
  })
}
