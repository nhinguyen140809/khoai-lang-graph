'use client'

/**
 * Rich field renderings the generic text fallbacks cannot carry (API.md §5:
 * the client renders from the schemas, but "a kind can still have its own
 * component where a generic form is not enough").
 *
 * `EvidenceField` draws the mined-evidence entries of a persona: the
 * observation-to-source chain of each quote (OBS-xxx → SRC-xxx), traced the
 * way ItemTracePanels labels links — mono keys, muted captions, the quote
 * itself as the one line of foreground text.
 * `GroupField` draws the consolidated stakeholder groups of the persona
 * catalog: one titled block per group with its observation keys.
 */

export interface EvidenceEntry {
  observation: string
  source: string
  quote: string
}

export interface GroupEntry {
  name: string
  description: string
  observations: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isEvidenceList(value: unknown): value is EvidenceEntry[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.observation === 'string' &&
        typeof entry.source === 'string' &&
        typeof entry.quote === 'string',
    )
  )
}

export function isGroupList(value: unknown): value is GroupEntry[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.name === 'string' &&
        typeof entry.description === 'string' &&
        Array.isArray(entry.observations) &&
        entry.observations.every((key) => typeof key === 'string'),
    )
  )
}

export function EvidenceField({ entries }: { entries: EvidenceEntry[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry, index) => (
        <li key={index} className="border-l-2 border-l-primary pl-3">
          <p className="font-mono text-xs text-muted-foreground">
            {entry.observation} <span aria-hidden>→</span> {entry.source}
          </p>
          <p className="text-sm">
            <span aria-hidden>“</span>
            {entry.quote}
            <span aria-hidden>”</span>
          </p>
        </li>
      ))}
    </ul>
  )
}

export function GroupField({ entries }: { entries: GroupEntry[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry, index) => (
        <li key={index} className="rounded-md border px-3 py-2">
          <p className="font-medium">{entry.name}</p>
          <p className="text-sm text-muted-foreground">{entry.description}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {entry.observations.join(' · ')}
          </p>
        </li>
      ))}
    </ul>
  )
}
