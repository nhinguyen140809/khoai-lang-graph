import { projectRoutes } from './project-routes.utils'
import { checkedRoute, search } from './route-builder.utils'
import { RouteParam, type UserSettingsSection } from './route-params.constants'
import { registerHref, signInHref } from './sign-in.utils'

/**
 * The addresses of the pages, grouped as the folders of `src/app/` are. Each leaf writes its whole
 * path in one template given to `checkedRoute`, so that the route types check it; a group gives its
 * pages only what they share, such as an id.
 */
export const routes = {
  home: () => checkedRoute('/'),
  /** The sign-in page, which returns to `next` afterwards. */
  signIn: signInHref,
  /** The page that creates an account, which returns to `next` afterwards. */
  register: registerHref,
  /** The list of the projects. */
  projects: () => checkedRoute('/projects'),
  /** A section of the settings of the user. */
  settings: (section: UserSettingsSection = 'profile') =>
    checkedRoute(
      `/settings${search({ [RouteParam.Section]: section === 'profile' ? undefined : section })}`,
    ),
  /** The pages of one project. */
  project: projectRoutes,
}
