import { routes } from '../../routes/routes.utils'

/** The name of each screen outside a project on the top bar, by the start of its address. */
export const homePageNames = [
  { path: routes.settings(), name: 'Settings' },
  { path: routes.projects(), name: 'Projects' },
]

/** The name on the top bar of an address outside a project that no screen above starts. */
export const homePageFallback = 'Projects'
