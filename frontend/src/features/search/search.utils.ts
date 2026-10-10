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

/** A field of an item as text; lists are joined by line, and an empty field reads as a dash. */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(formatFieldValue).join('\n')
  return JSON.stringify(value)
}

/** A field name as a label: "acceptance_criteria" reads "Acceptance criteria". */
export function fieldLabel(field: string): string {
  const words = field.replaceAll('_', ' ')
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`
}
