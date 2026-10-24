/** An address, and its path. */
export const pathOfCases = [
  ['/projects/p1/search?q=REQ#top', '/projects/p1/search'],
  ['/projects/p1/search?q=REQ', '/projects/p1/search'],
  ['/projects/p1/search#top', '/projects/p1/search'],
  ['/projects/p1/search', '/projects/p1/search'],
  ['/?mock-me=error', '/'],
]

/** The path of a page, a path, and whether the page is at that path or under it. */
export const isAtOrUnderCases = [
  { pathname: '/settings', path: '/settings', holds: true },
  { pathname: '/settings/profile', path: '/settings', holds: true },
  { pathname: '/projects/p1/console/t1', path: '/projects/p1', holds: true },
  { pathname: '/settings-old', path: '/settings', holds: false },
  { pathname: '/', path: '/settings', holds: false },
]
