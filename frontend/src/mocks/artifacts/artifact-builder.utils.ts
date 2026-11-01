import type { Artifact, ArtifactItem, Origin, TraceLink } from '@/features/artifacts'

import { IdPrefix, mockId, USER_ID } from '../shared/mock-ids.constants'

// A small way to write the artifacts of a project as trees, and to turn them into the records that
// the API serves: ids, positions, outline numbers and trace links.

type ReviewStatus = Artifact['review_status']

export interface ItemSpec {
  key: string
  kind: string
  content: Record<string, unknown>
  status?: ReviewStatus
  /** The version of the item; it starts at 1. */
  version?: number
  /** Items inside it: the contents of a section, or the stories of an epic. */
  children?: ItemSpec[]
}

export interface ArtifactSpec {
  kind: string
  title: string
  summary: string | null
  content: Record<string, unknown>
  items: ItemSpec[]
  status?: ReviewStatus
  version?: number
  /** For an interview: the key of the persona that is interviewed. */
  subjectKey?: string
}

export interface LinkSpec {
  source: string
  target: string
  type: string
  /** The version of the target when the link was made; the current one when absent. */
  targetVersion?: number
  quote?: string
  note?: string
}

export interface BuiltProject {
  artifacts: Artifact[]
  items: ArtifactItem[]
  links: TraceLink[]
}

const agentOrigin = (role: string, runId: string): Origin => ({
  actor: 'agent',
  agent_role: role,
  user_id: null,
  run_id: runId,
  step_id: null,
})

const userOrigin: Origin = {
  actor: 'user',
  agent_role: null,
  user_id: USER_ID,
  run_id: null,
  step_id: null,
}

// The agent role that makes the artifacts of each kind.
const roleOfKind: Record<string, string> = {
  elicitation_plan: 'planner',
  persona_catalog: 'persona_generator',
  interview_transcript: 'interviewer',
  requirements_analysis: 'analyst',
  requirement_specification: 'requirement_engineer',
  product_backlog: 'backlog_manager',
  validation_report: 'validator',
}

interface BuildOptions {
  /** A number that makes the ids of this project differ from the ids of the others. */
  n: number
  projectId: string
  runId: string
  /** The day the artifacts were made, as `yyyy-mm-dd`. */
  day: string
  /** The keys of the items that the user edited, with their new version. */
  editedKeys?: Record<string, number>
}

/** Builds the artifacts, the items in outline order, and the trace links of one project. */
export function buildProject(
  specs: ArtifactSpec[],
  linkSpecs: LinkSpec[],
  { n, projectId, runId, day, editedKeys = {} }: BuildOptions,
): BuiltProject {
  const artifacts: Artifact[] = []
  const items: ArtifactItem[] = []
  let itemNumber = 0

  specs.forEach((spec, artifactIndex) => {
    const artifactId = mockId(IdPrefix.Artifact, n * 100 + artifactIndex + 1)
    const origin = agentOrigin(roleOfKind[spec.kind] ?? 'planner', runId)
    const time = `${day}T09:${String(10 + artifactIndex).padStart(2, '0')}:00Z`
    const hasParents = spec.items.some((entry) => (entry.children ?? []).length > 0)
    const built: ArtifactItem[] = []

    const walk = (list: ItemSpec[], parentId: string | null, numberPrefix: string) => {
      list.forEach((entry, index) => {
        itemNumber += 1
        const id = mockId(IdPrefix.Item, n * 1000 + itemNumber)
        const outline = `${numberPrefix}${String(index + 1)}`
        const edited = editedKeys[entry.key]
        built.push({
          id,
          artifact_id: artifactId,
          project_id: projectId,
          key: entry.key,
          kind: entry.kind,
          parent_item_id: parentId,
          position: index + 1,
          number: hasParents ? outline : null,
          schema_version: 1,
          version: edited ?? entry.version ?? 1,
          review_status: entry.status ?? spec.status ?? 'draft',
          created_by: origin,
          updated_by: edited === undefined ? origin : userOrigin,
          created_at: time,
          updated_at: time,
          content: entry.content,
        })
        walk(entry.children ?? [], id, `${outline}.`)
      })
    }
    walk(spec.items, null, '')
    items.push(...built)

    const subject =
      spec.subjectKey === undefined
        ? null
        : (items.find(({ key }) => key === spec.subjectKey)?.id ?? null)
    artifacts.push({
      id: artifactId,
      kind: spec.kind,
      project_id: projectId,
      title: spec.title,
      summary: spec.summary,
      schema_version: 1,
      content: spec.content,
      subject_item_id: subject,
      version: spec.version ?? 1,
      review_status: spec.status ?? 'draft',
      item_count: built.length,
      created_by: origin,
      updated_by: origin,
      created_at: time,
      updated_at: time,
    })
  })

  const byKey = new Map(items.map((item) => [item.key, item]))
  const links: TraceLink[] = linkSpecs.flatMap((link, index) => {
    const source = byKey.get(link.source)
    const target = byKey.get(link.target)
    if (source === undefined || target === undefined) return []
    return [
      {
        id: mockId(IdPrefix.TraceLink, n * 1000 + index + 1),
        source_item_id: source.id,
        target_item_id: target.id,
        link_type: link.type,
        target_version: link.targetVersion ?? target.version,
        quote: link.quote ?? null,
        note: link.note ?? null,
      },
    ]
  })

  return { artifacts, items, links }
}
