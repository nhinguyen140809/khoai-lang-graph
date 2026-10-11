import type { Item } from './search.types'

// Fields that can name an item, in order of preference.
const nameFields = ['title', 'name', 'statement'] as const

/** What an item is called: its title or name, else the key. */
export function itemTitle(item: Pick<Item, 'key' | 'content'>): string {
  for (const field of nameFields) {
    const value = item.content[field]
    if (typeof value === 'string' && value !== '') return value
  }
  return item.key
}
