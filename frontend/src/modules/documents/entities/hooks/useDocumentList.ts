'use client'

import { useCallback, useMemo } from 'react'

import { useProjectArtifacts } from '@/modules/artifact/entities/@x/documents'
import { isUnfinishedRunStatus } from '@/modules/run/entities/@x/documents'
import {
  itemTitle,
  kindSchemasByKind,
  subjectKindByStage,
  useArtifactKinds,
  useKindTitleOf,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/documents'

import type { DocumentListResult, NotStartedSubject } from '../types/documents.types'
import { documentEntries } from '../utils/documents.utils'
import { useDocumentsUnderReview } from './useDocumentsUnderReview'
import { useSubjectsWithoutArtifact } from './useSubjectsWithoutArtifact'
import { useWritingArtifacts } from './useWritingArtifacts'

/** The documents of a project with their marks: being written, waiting for review, or their progress. */
export function useDocumentList(projectId: string): DocumentListResult {
  const definition = useWorkflowDefinition()
  const kinds = useArtifactKinds()
  const artifacts = useProjectArtifacts(projectId)
  const { run, reviewIds } = useDocumentsUnderReview(projectId)
  const writingIds = useWritingArtifacts(projectId)

  const hasUnfinishedRun = run !== null && isUnfinishedRunStatus(run.status)
  const kindTitleOf = useKindTitleOf()

  const subjectItemKinds = useMemo(
    () => (definition.data === undefined ? [] : [...subjectKindByStage(definition.data).values()]),
    [definition.data],
  )
  const subjectItems = useSubjectsWithoutArtifact(projectId, subjectItemKinds, {
    isEnabled: hasUnfinishedRun,
  })
  const subjects = useMemo(() => {
    const schemas = kindSchemasByKind(kinds.data)
    return new Map(
      Array.from(subjectItems, ([kind, items]): [string, NotStartedSubject[]] => [
        kind,
        items.map((item) => ({ id: item.id, title: itemTitle(schemas.get(kind)?.schema, item) })),
      ]),
    )
  }, [subjectItems, kinds.data])

  const entries = useMemo(
    () =>
      definition.data === undefined || artifacts.data === undefined
        ? []
        : documentEntries({
            kinds: definition.data.artifact_kinds,
            kindTitleOf,
            artifacts: artifacts.data,
            writingIds,
            reviewIds,
            subjects,
            hasUnfinishedRun,
          }),
    [definition.data, artifacts.data, kindTitleOf, writingIds, reviewIds, subjects, hasUnfinishedRun],
  )
  const isUnderReview = useCallback((artifactId: string) => reviewIds.has(artifactId), [reviewIds])

  if (definition.isError || kinds.isError || artifacts.isError) {
    return {
      state: 'error',
      retry: () => {
        void definition.refetch()
        void kinds.refetch()
        void artifacts.refetch()
      },
    }
  }
  if (definition.data === undefined || artifacts.data === undefined || kinds.data === undefined) {
    return { state: 'pending' }
  }
  return { state: 'success', entries, hasUnfinishedRun, isUnderReview }
}
