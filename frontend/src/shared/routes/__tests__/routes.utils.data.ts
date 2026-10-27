import { routes } from '../routes.utils'

/** A page, how `routes` builds its address, and the address. */
export const routeCases = [
  { page: 'the home page', href: () => routes.home(), path: '/' },
  { page: 'the settings', href: () => routes.settings(), path: '/settings' },
  { page: 'the list of the projects', href: () => routes.projects(), path: '/projects' },
  {
    page: 'the activity of a project',
    href: () => routes.project('p1').activity(),
    path: '/projects/p1/activity',
  },
  {
    page: 'the activity of a project whose id needs encoding',
    href: () => routes.project('a/b c').activity(),
    path: '/projects/a%2Fb%20c/activity',
  },
  {
    page: 'the login page, which returns to the page asked for',
    href: () => routes.login('/settings'),
    path: '/login?next=%2Fsettings',
  },
  {
    page: 'the page that creates an account, which returns to the page asked for',
    href: () => routes.register('/settings'),
    path: '/register?next=%2Fsettings',
  },
  { page: 'the page that creates an account', href: () => routes.register(), path: '/register' },
]
