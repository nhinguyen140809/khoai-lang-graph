import type { InfiniteData } from '@tanstack/react-query'

import type { ListPage } from '@/shared/api/request'

/** The items of every page loaded by an infinite query, in order; none before the first page. */
export function pageItems<T>(infinite: InfiniteData<ListPage<T>> | undefined): T[] {
  return infinite?.pages.flatMap((page) => page.items) ?? []
}
