/** The page to return to after logging in, and the page that opens. */
export const returnCases = [
  { next: '/threads/t1', opens: '/threads/t1' },
  { next: '/projects/p1/console?tab=runs#step-3', opens: '/projects/p1/console?tab=runs#step-3' },
  { next: '//example.com', opens: '/' },
  { next: '/login', opens: '/' },
  { next: null, opens: '/' },
]
