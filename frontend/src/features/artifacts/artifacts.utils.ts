import type { ArtifactSummary, TreeItem } from './artifacts.types'

// Display helpers of the Artifacts tab. They mirror the ones of the search
// feature; a later shared `src/api/generated` sweep lifts them into one place.

// Fields that can name an item, in order of preference.
const nameFields = ['title', 'name', 'statement'] as const

/** What an item is called: its title or name, else the key. */
export function itemTitle(item: Pick<TreeItem, 'key' | 'content'>): string {
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

/** The label of an artifact node: its title, else the humanized kind. */
export function artifactTitle(artifact: Pick<ArtifactSummary, 'title' | 'kind'>): string {
  if (artifact.title !== '') return artifact.title
  return fieldLabel(artifact.kind)
}

/** The items of one artifact grouped by kind, each group sorted by key. */
export function itemsOfArtifact(items: TreeItem[], artifactId: string) {
  const own = items.filter((item) => item.artifact_id === artifactId)
  const kinds = new Map<string, TreeItem[]>()
  for (const item of own) {
    const group = kinds.get(item.kind)
    if (group) group.push(item)
    else kinds.set(item.kind, [item])
  }
  return [...kinds.entries()].map(([kind, group]) => ({
    kind,
    items: [...group].sort((a, b) => a.key.localeCompare(b.key)),
  }))
}
