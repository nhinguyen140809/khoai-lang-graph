import { encodeId } from '@/shared/lib/url'

import { loginHref, registerHref } from './auth'
import { projectRoutes } from './project-routes.utils'
import { checkedRoute } from './typed-route'

/**
 * The addresses of the pages of the developer view, and of the pages that every view has, grouped
 * as the folders of `src/app/` are. Each leaf writes the whole path of its page in one template
 * given to `checkedRoute`, so that the route types check it; a group gives its pages only what they
 * share, such as an id.
 */
export const routes = {
  home: () => checkedRoute('/developer'),
  /** The page that asks which view of the app to use, the same on every host. */
  views: () => checkedRoute('/views'),
  /** The login page, which returns to `next` afterwards. */
  login: loginHref,
  /** The page that creates an account, which returns to `next` afterwards. */
  register: registerHref,
  /** The list of the projects. */
  projects: () => checkedRoute('/developer/projects'),
  /** The settings of the user. */
  settings: () => checkedRoute('/developer/settings'),
  /** The pages of one project. */
  project: projectRoutes,
}

/** The addresses of the pages of the user view. */
export const userRoutes = {
  /** The start page: the prompt that starts a project. */
  home: () => checkedRoute('/user'),
  /** Every project of the user, active or archived, with a search. */
  recents: () => checkedRoute('/user/recents'),
  /** The settings of the user. */
  settings: () => checkedRoute('/user/settings'),
  /** The chat of one project. */
  project: (projectId: string) => checkedRoute(`/user/projects/${encodeId(projectId)}`),
}
