import { routes } from '../routes.utils'

/** A page, how `routes` builds its address, and the address. */
export const routeCases = [
  { page: 'the home page', href: () => routes.home(), path: '/' },
  { page: 'the settings', href: () => routes.settings(), path: '/settings' },
  {
    page: 'the sign-in page, which returns to the page asked for',
    href: () => routes.signIn('/settings'),
    path: '/login?next=%2Fsettings',
  },
  {
    page: 'the page that creates an account, which returns to the page asked for',
    href: () => routes.register('/settings'),
    path: '/register?next=%2Fsettings',
  },
  { page: 'the page that creates an account', href: () => routes.register(), path: '/register' },
]
