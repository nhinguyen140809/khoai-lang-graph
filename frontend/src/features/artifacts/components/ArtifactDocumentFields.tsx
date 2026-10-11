'use client'

import { useArtifactKinds } from '../hooks/useArtifactKinds'

interface ArtifactDocumentFieldsProps {
  kind: string
  content: Record<string, unknown>
}

/**
 * The `document` drawing (web-app.md §6): the fields of the artifact in
 * `x-ui-field-order`, each value printed as text.
 */
export function ArtifactDocumentFields({ kind, content }: ArtifactDocumentFieldsProps) {
  const kinds = useArtifactKinds()
  if (!kinds.isSuccess) return null
  const entry = kinds.data.artifact_kinds.find((candidate) => candidate.kind === kind)
  const order: string[] =
    (entry?.schema as { 'x-ui-field-order'?: string[] } | undefined)?.[
      'x-ui-field-order'
    ] ?? Object.keys(content)
  const entries = order.filter((field) => field in content)
  if (entries.length === 0) return null
  return (
    <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-3 text-sm">
      {entries.map((field) => (
        <div key={field} className="contents">
          <dt className="text-muted-foreground">{field.replaceAll('_', ' ')}</dt>
          <dd className="whitespace-pre-line">{fieldValue(content[field])}</dd>
        </div>
      ))}
    </dl>
  )
}

function fieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value))
    return value.map((entry) => fieldValue(entry)).join('\n')
  return JSON.stringify(value)
}
