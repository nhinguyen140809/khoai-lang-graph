import { loginHref, registerHref } from './auth/auth-hrefs.utils'
import { projectRoutes } from './project-routes.utils'
import { checkedRoute } from './typed-route'

/**
 * The addresses of the pages, grouped as the folders of `src/app/` are. Each leaf writes its whole
 * path in one template given to `checkedRoute`, so that the route types check it; a group gives its
 * pages only what they share, such as an id.
 */
export const routes = {
  home: () => checkedRoute('/'),
  /** The login page, which returns to `next` afterwards. */
  login: loginHref,
  /** The page that creates an account, which returns to `next` afterwards. */
  register: registerHref,
  /** The list of the projects. */
  projects: () => checkedRoute('/projects'),
  /** The settings of the user. */
  settings: () => checkedRoute('/settings'),
  /** The pages of one project. */
  project: projectRoutes,
}
