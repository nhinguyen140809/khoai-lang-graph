import { type Artifact, attentionLevels } from '@/modules/artifact/entities/@x/documents'
import type { DefinedArtifactKind } from '@/modules/workflow/entities/@x/documents'

import { documentMarkLooks } from '../constants/documents.constants'
import type {
  DocumentEntry,
  DocumentMark,
  MarkedArtifact,
  NotStartedSubject,
} from '../types/documents.types'

/**
 * The mark of an artifact, the first that holds: `writing` when the node in progress wrote it;
 * `review` when the pending interrupt lists it for review; `approved` when its review status is
 * approved; else `draft`.
 */
export function documentMark(
  artifact: Pick<Artifact, 'id' | 'review_status'>,
  { writingIds, reviewIds }: { writingIds: ReadonlySet<string>; reviewIds: ReadonlySet<string> },
): DocumentMark {
  if (writingIds.has(artifact.id)) return 'writing'
  if (reviewIds.has(artifact.id)) return 'review'
  if (artifact.review_status === 'approved') return 'approved'
  return 'draft'
}

/**
 * The mark of a group: `writing` or `review` when one of its documents has it, in that order; else
 * `approved` when all are; `notStarted` without a document; else `draft`.
 */
export function groupMark(documents: readonly Pick<MarkedArtifact, 'mark'>[]): DocumentMark {
  if (documents.length === 0) return 'notStarted'
  for (const mark of ['writing', 'review'] as const) {
    if (documents.some((document) => document.mark === mark)) return mark
  }
  return documents.every(({ mark }) => mark === 'approved') ? 'approved' : 'draft'
}

/**
 * The rows of the list of documents: one for each artifact kind of the definition, in its order. A
 * kind that has one artifact gives a document; the other kinds give a group. A kind without any
 * artifact shows, as not started, only while the project has an unfinished run.
 */
export function documentEntries({
  kinds,
  titles,
  artifacts,
  writingIds,
  reviewIds,
  subjects,
  hasUnfinishedRun,
}: {
  kinds: readonly Pick<DefinedArtifactKind, 'kind' | 'per_project' | 'subject_item_kind'>[]
  titles: ReadonlyMap<string, string>
  artifacts: readonly Artifact[]
  writingIds: ReadonlySet<string>
  reviewIds: ReadonlySet<string>
  /** The subjects that have no artifact yet, by the kind of the subject items. */
  subjects: ReadonlyMap<string, readonly NotStartedSubject[]>
  hasUnfinishedRun: boolean
}): DocumentEntry[] {
  return kinds.flatMap((definedKind): DocumentEntry[] => {
    const title = titles.get(definedKind.kind) ?? definedKind.kind
    const own = artifacts.filter(({ kind }) => kind === definedKind.kind)
    const marked = own.map((artifact) => ({
      artifact,
      mark: documentMark(artifact, { writingIds, reviewIds }),
    }))
    if (marked.length === 0 && !hasUnfinishedRun) return []
    if (definedKind.per_project === 'one') {
      const [first] = marked
      return [
        {
          type: 'document',
          kind: definedKind.kind,
          title: first?.artifact.title ?? title,
          artifact: first?.artifact ?? null,
          mark: first?.mark ?? 'notStarted',
        },
      ]
    }
    return [
      {
        type: 'group',
        kind: definedKind.kind,
        title,
        subjectItemKind: definedKind.subject_item_kind,
        documents: marked.toSorted((a, b) => a.artifact.title.localeCompare(b.artifact.title)),
        notStarted:
          definedKind.subject_item_kind === null
            ? []
            : [...(subjects.get(definedKind.subject_item_kind) ?? [])],
        mark: groupMark(marked),
      },
    ]
  })
}

/** How a document mark shows: its level, its color (null for the text color), its letter and its label. */
export function documentMarkLook(mark: DocumentMark) {
  const look = documentMarkLooks[mark]
  return { ...look, color: attentionLevels[look.level].color }
}
