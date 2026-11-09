/** An item whose trace an action opens: its id, and its title when the opener knows it, which names the tab. */
export interface TracedItem {
  id: string
  title?: string | undefined
}
