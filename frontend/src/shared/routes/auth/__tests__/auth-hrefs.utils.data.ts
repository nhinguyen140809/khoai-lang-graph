import { loginHref, registerHref } from '../auth-hrefs.utils'

/** A page of the app to return to, kept as it is. */
export const keptNextPaths = [
  '/projects/p1/console?mock-run-state=done',
  '/projects/p1/console#step-3',
  '/settings',
]

/** A page to return to that is not of this app, or is a login page: the home page instead. */
export const replacedNextPaths = [
  null,
  undefined,
  '',
  'https://example.com',
  '//example.com/x',
  '/\\example.com',
  'projects',
  '/\t/example.com',
  '/\n/example.com',
  '/\r/example.com',
  '/login?next=%2Fprojects',
  '/login/',
  '/register',
  '/register#top',
]

/** A builder of the address of a login page, the page to return to, and the address. */
export const authHrefCases = [
  {
    name: 'loginHref of a page of the app',
    build: loginHref,
    next: '/projects/p1/console',
    href: '/login?next=%2Fprojects%2Fp1%2Fconsole',
  },
  {
    name: 'registerHref of a page of the app',
    build: registerHref,
    next: '/projects/p1/console',
    href: '/register?next=%2Fprojects%2Fp1%2Fconsole',
  },
  { name: 'registerHref without a page', build: registerHref, next: null, href: '/register' },
  {
    name: 'loginHref of another site',
    build: loginHref,
    next: 'https://example.com',
    href: '/login',
  },
  { name: 'loginHref of the home page', build: loginHref, next: '/', href: '/login' },
  {
    name: 'registerHref of a sign-in page',
    build: registerHref,
    next: '/login',
    href: '/register',
  },
]

/** The address of the page on screen, and the address of the login page that returns to it. */
export const loginHrefForCases = [
  {
    name: 'returns to the whole address: path, query and fragment',
    location: { pathname: '/threads/t1', search: '?tab=runs', hash: '#step-3' },
    href: '/login?next=%2Fthreads%2Ft1%3Ftab%3Druns%23step-3',
  },
  {
    name: 'needs no page to return to from the home page',
    location: { pathname: '/', search: '', hash: '' },
    href: '/login',
  },
  {
    name: 'stays on the sign-in page',
    location: { pathname: '/login', search: '?next=%2Fsettings', hash: '' },
    href: null,
  },
  {
    name: 'stays on the page that creates an account',
    location: { pathname: '/register', search: '', hash: '' },
    href: null,
  },
]

/** The query of a page, and the one page to return to that it names. */
export const nextParamCases = [
  { name: 'one value', query: { next: '/settings' }, next: '/settings' },
  { name: 'several values', query: { next: ['/a', '/b'] }, next: null },
  { name: 'no value', query: {}, next: null },
]
