import type { MenuAction } from '@/shared/components/ui/menu-action'

/** An item that an action opens: its id, and its title when the opener knows it, which names the tab. */
export interface OpenableItem {
  id: string
  title?: string | undefined
}

/**
 * The two ways to open the page of an item, as the actions of a menu or a button: in the preview
 * tab, and in a tab of its own. Neither is ever disabled.
 */
export interface OpenItemActions {
  open: MenuAction
  openInNewTab: MenuAction
}
