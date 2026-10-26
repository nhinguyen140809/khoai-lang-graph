/** A page of a list, and the cursor of the page after it. */
export const cursorCases = [
  { name: 'a page that has a next one', page: { items: [1], next_cursor: 'c2' }, next: 'c2' },
  { name: 'the last page', page: { items: [], next_cursor: null }, next: null },
]
