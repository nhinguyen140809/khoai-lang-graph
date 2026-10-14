import { checkedRoute } from './route-builder.utils'

/**
 * The addresses of the pages, grouped as the folders of `src/app/` are. Each leaf writes its whole
 * path in one template given to `checkedRoute`, so that the route types check it; a group gives its
 * pages only what they share, such as an id.
 */
export const routes = {
  home: () => checkedRoute('/'),
  /** The settings of the user. */
  settings: () => checkedRoute('/settings'),
}
