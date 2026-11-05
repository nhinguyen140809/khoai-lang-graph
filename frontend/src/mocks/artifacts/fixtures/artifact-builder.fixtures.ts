import type { Artifact, ArtifactItem } from '@/modules/artifact/entities'
import { isRecord, isString } from '@/shared/lib/guards'

import { IdPrefix, mockId } from '../../shared/db'
import { findKind } from '../../workflow/artifact-kinds.fixtures'
import { placeInOutline } from '../artifact-outline.utils'
import type { ArtifactSpec, BuiltProject, ItemSpec } from '../artifacts.types'
import { agentOrigin, userOrigin } from '../origins.utils'

// A small way to write the artifacts of a project as trees, and to turn them into the records that
// the API serves: ids, positions and outline numbers.

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

// The version of the content schema that the definition gives a kind.
const schemaVersionOf = (kind: string) => findKind(kind)?.schema_version ?? 1

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

// A participant of an interview reaches the item it is, such as its persona; the builder resolves
// the item ids of the whole project, as it resolves the subject of the interview.
function withParticipantIds(content: ArtifactSpec['content'], items: ArtifactItem[]) {
  const listed = content.participants
  if (!Array.isArray(listed)) return content
  return {
    ...content,
    participants: listed.map((entry: unknown) => {
      if (!isRecord(entry) || !isString(entry.key)) return entry
      return { ...entry, item_id: items.find(({ key }) => key === entry.key)?.id ?? null }
    }),
  }
}

/** Builds the artifacts and the items in outline order of one project. */
export function buildProjectArtifacts(
  specs: ArtifactSpec[],
  { n, projectId, runId, day, editedKeys = {} }: BuildOptions,
): BuiltProject {
  const artifacts: Artifact[] = []
  const items: ArtifactItem[] = []
  let itemNumber = 0

  specs.forEach((spec, artifactIndex) => {
    const artifactId = mockId(IdPrefix.Artifact, n * 100 + artifactIndex + 1)
    const origin = agentOrigin(roleOfKind[spec.kind] ?? 'planner', runId)
    const time = `${day}T09:${String(10 + artifactIndex).padStart(2, '0')}:00Z`
    const built: ArtifactItem[] = []

    const walk = (list: ItemSpec[], parentId: string | null) => {
      list.forEach((entry, index) => {
        itemNumber += 1
        const id = mockId(IdPrefix.Item, n * 1000 + itemNumber)
        const edited = editedKeys[entry.key]
        built.push({
          id,
          artifact_id: artifactId,
          project_id: projectId,
          key: entry.key,
          kind: entry.kind,
          parent_item_id: parentId,
          position: index + 1,
          outline_number: '', // placed below
          schema_version: schemaVersionOf(entry.kind),
          version: edited ?? entry.version ?? 1,
          review_status: entry.status ?? spec.status ?? 'draft',
          created_by: origin,
          updated_by: edited === undefined ? origin : userOrigin,
          created_at: time,
          updated_at: time,
          content: entry.content,
        })
        walk(entry.children ?? [], id)
      })
    }
    walk(spec.items, null)
    // The numbers of the outline come from the same place as the numbers that the mock serves.
    items.push(...placeInOutline(built).map(({ item }) => item))

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
      schema_version: schemaVersionOf(spec.kind),
      content: withParticipantIds(spec.content, items),
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

  return { artifacts, items }
}
