/** The id of the row of an item in the outline. */
export function itemNodeId(itemId: string): string {
  return `item:${itemId}`
}

/** The id of the block of an item on the page of its document, which the address of the item scrolls to. */
export function itemAnchorId(itemId: string): string {
  return `item-${itemId}`
}

/** The props that tie the block of an item to the address of the page: its anchor, a target of the focus, and `data-target` when the address names it. */
export function itemAnchorProps(itemId: string, targetItemId: string | null) {
  return {
    id: itemAnchorId(itemId),
    tabIndex: -1,
    ...(targetItemId === itemId ? { 'data-target': '' } : {}),
  } as const
}
