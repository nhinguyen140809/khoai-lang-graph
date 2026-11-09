import type { Artifact, ArtifactItem, KindView } from '@/modules/artifact/entities'
import type { DocumentEntry } from '@/modules/documents/entities'
import type { TraceAttentionResult } from '@/modules/trace/entities'

import type { DocumentOutlineInput } from '../trace-tree.types'

const artifact = (id: string, kind: string, title: string): Artifact =>
  ({ id, kind, title, project_id: 'p1', status: 'approved' }) as unknown as Artifact

/** One item of a document, with the words of its title field filled. */
function item({
  name,
  ...over
}: {
  id: string
  artifact_id: string
  kind: string
  key: string
  name: string
  parent_item_id?: string | null
  review_status?: ArtifactItem['review_status']
}): ArtifactItem {
  return {
    project_id: 'p1',
    parent_item_id: null,
    position: 1,
    outline_number: '',
    schema_version: 1,
    version: 1,
    review_status: 'approved',
    created_by: { actor: 'user', agent_role: null, user_id: 'u1', run_id: null, step_id: null },
    updated_by: { actor: 'user', agent_role: null, user_id: 'u1', run_id: null, step_id: null },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    content: { name },
    ...over,
  }
}

/** Two documents: the specification, and the group of the interview transcripts. */
export const entries: readonly DocumentEntry[] = [
  {
    type: 'document',
    kind: 'requirement_specification',
    title: 'Requirement specification',
    artifact: artifact('a-spec', 'requirement_specification', 'Requirement specification'),
    mark: 'approved',
  } satisfies DocumentEntry,
  {
    type: 'group',
    kind: 'interview_transcript',
    title: 'Interview transcripts',
    subjectItemKind: 'persona',
    documents: [
      {
        artifact: artifact('a-tra', 'interview_transcript', 'Interview of Minh'),
        mark: 'approved',
      },
    ],
    notStarted: [{ id: 's-1', title: 'Hoa' }],
    mark: 'approved',
  },
]

/** Every item of the project, as the read of the panel hands them: two requirements of the
 * specification, one message of a transcript, and one superseded requirement. */
export const items: ArtifactItem[] = [
  item({
    id: 'i-1',
    artifact_id: 'a-spec',
    kind: 'requirement',
    key: 'R-1',
    name: 'Search mentors',
  }),
  item({
    id: 'i-2',
    artifact_id: 'a-spec',
    kind: 'requirement',
    key: 'R-2',
    name: 'Filter by field',
  }),
  item({ id: 'i-3', artifact_id: 'a-tra', kind: 'message', key: 'M-1', name: 'Hello' }),
  item({
    id: 'i-0',
    artifact_id: 'a-spec',
    kind: 'requirement',
    key: 'R-0',
    name: 'Old requirement',
    review_status: 'superseded',
  }),
]

/** The two documents as the outlines read them: the kinds of item each kind of artifact holds. */
export const documents: readonly DocumentOutlineInput[] = [
  {
    artifact: artifact('a-spec', 'requirement_specification', 'Requirement specification'),
    itemKinds: ['requirement'],
  },
  {
    artifact: artifact('a-tra', 'interview_transcript', 'Interview of Minh'),
    itemKinds: ['message'],
  },
]

/** The schema of a kind that names `name` as the field of its title. */
function schemaOf(title: string): KindView['schema'] {
  return { title, 'x-ui-title-field': 'name', properties: { name: { type: 'string' } } }
}

/** The view of every kind the project uses. */
export const kindViews: ReadonlyMap<string, KindView> = new Map<string, KindView>([
  [
    'requirement_specification',
    { title: 'Requirement specification', display: 'document', schema: schemaOf('Requirement') },
  ],
  [
    'interview_transcript',
    { title: 'Interview transcript', display: 'transcript', schema: schemaOf('Message') },
  ],
  ['requirement', { title: 'Requirement', display: 'table', schema: schemaOf('Requirement') }],
  ['message', { title: 'Message', display: 'transcript', schema: schemaOf('Message') }],
])

/** The attention: one item at act, the document of the group at follow. */
export const attention: TraceAttentionResult = {
  state: 'success',
  attentionOf: () => ({ level: 'none', reasons: [] }),
  attentionByArtifact: new Map([
    ['a-spec', { level: 'act', reasons: ['The links need a new look.'] }],
    ['a-tra', { level: 'follow', reasons: ['These requirements are not based on any need.'] }],
  ]),
}
