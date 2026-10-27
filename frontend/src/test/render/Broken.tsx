/** An item whose content fails to render. */
export function Broken(): never {
  throw new Error('The item failed.')
}
