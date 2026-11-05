import type { Artifact } from '@/modules/artifact/entities/@x/documents'

/** What a document of the side panel shows: being written, waiting for the user, or its progress. */
export type DocumentMark = 'writing' | 'review' | 'approved' | 'draft' | 'notStarted'

/** A document of a group: one artifact with its mark. */
export interface MarkedArtifact {
  artifact: Artifact
  mark: DocumentMark
}

/** A subject that has no artifact yet, titled as its kind titles its items. */
export interface NotStartedSubject {
  id: string
  title: string
}

/** A row of the list of documents: one artifact, or the group of the artifacts of one kind. */
export type DocumentEntry =
  | {
      type: 'document'
      kind: string
      title: string
      artifact: Artifact | null
      mark: DocumentMark
    }
  | {
      type: 'group'
      kind: string
      title: string
      /** The kind of the subject items, when the group holds one artifact for each subject. */
      subjectItemKind: string | null
      documents: MarkedArtifact[]
      /** The subjects that have no artifact yet, while the project has an unfinished run. */
      notStarted: NotStartedSubject[]
      mark: DocumentMark
    }

export type DocumentListResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | {
      state: 'success'
      entries: DocumentEntry[]
      hasUnfinishedRun: boolean
      /** Whether the pending review of the run lists the document. */
      isUnderReview: (artifactId: string) => boolean
    }
