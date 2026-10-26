/** One page of a list endpoint: its items and the cursor of the next page. */
export interface ListPage<T> {
  items: T[]
  next_cursor: string | null
}
