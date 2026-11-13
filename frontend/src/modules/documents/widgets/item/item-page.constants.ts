import type { ItemMove } from './item-page.types'

export const itemPageMessages = {
  navigator: 'Go through the items',
  location: 'Where the item sits',
  separator: '/',
  tabTitle: 'Item',
  titleLoading: '...',
  position: (index: number, count: number) => `${String(index)} of ${String(count)}`,
  previous: 'Previous item',
  next: 'Next item',
  notFound: { title: 'Item not found', description: 'This item does not exist, or was deleted.' },
  loading: 'Loading the item',
  loadError: 'The item could not load.',
  linksLoading: 'Loading the links',
  moreLinks: (count: number) => `${String(count)} more`,
  linksLoadError: 'The links could not load.',
} as const

/** The words of the menu that gathers the actions of an item. */
export const itemActionsMessages = {
  more: 'More actions',
} as const

/** How long the navigator stays after the last action of the user, in milliseconds. */
export const navigatorIdleMs = 2_500

/** How many chips of one link group show before "N more" replaces the rest. */
export const linkChipsShown = 5

/**
 * The ways to move from an item to a neighbor in its document, each with the type that a change of
 * page carries, so that the content slides the way of the move.
 */
export const itemMoveTypes: Record<ItemMove, string> = {
  previous: 'item-previous',
  next: 'item-next',
}

/**
 * How the content of the page of an item moves when another one takes its place, by the type of
 * the move: the neighbors slide the way of the move, and any other change, such as the content
 * that arrives after the loading state, crosses over with a fade.
 */
export const itemContentShare = {
  [itemMoveTypes.previous]: itemMoveTypes.previous,
  [itemMoveTypes.next]: itemMoveTypes.next,
  default: 'item-fade',
}
