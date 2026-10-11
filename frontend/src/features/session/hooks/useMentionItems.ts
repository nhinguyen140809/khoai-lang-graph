import { useQuery } from '@tanstack/react-query'

import { searchMentionItems } from '../session.api'

/** The items that match what follows an `@`; nothing is read until there is text. */
export function useMentionItems(projectId: string, query: string | null) {
  return useQuery({
    queryKey: ['session', 'mention', projectId, query],
    queryFn: () => searchMentionItems(projectId, query ?? ''),
    enabled: query !== null && query.length >= 1,
    placeholderData: (previous) => previous,
  })
}
