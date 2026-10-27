import type { ListPage } from '@/shared/api/request'

/**
 * The options of an infinite query over a list endpoint: it starts with the first page and follows
 * the `next_cursor` of each page to the next.
 */
export const cursorPagesOptions = {
  initialPageParam: null as string | null,
  getNextPageParam: (page: ListPage<unknown>) => page.next_cursor,
}
