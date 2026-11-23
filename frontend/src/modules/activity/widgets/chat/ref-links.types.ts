/** A document or an item that a message of an agent names. */
export type Reference =
  | { type: 'artifact'; id: string; kind: string; title: string; version: number }
  | { type: 'item'; id: string; key: string; version: number }

/** What a reference shows as: the drawing of its kind, its title and what it is. */
export interface RefLook {
  label: string
  title: string
  description: string
  /** The version of what it names, shown as a badge on the card. */
  version: number
  /** How it is drawn, as the grid of the documents draws it: a folder or a page. */
  look: 'folder' | 'text'
  /** The name of the icon of its kind, which the drawing resolves. */
  icon: string | null
  /** The text its color comes from, so a kind keeps its color wherever it shows. */
  seed: string
}
