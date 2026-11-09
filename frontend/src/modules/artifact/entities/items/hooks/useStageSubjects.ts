'use client'

import { useMemo } from 'react'

import { useItemTitleOf, useWorkflowDefinition } from '@/modules/workflow/entities/@x/artifact'

import type { StageSubject } from '../items.types'
import { useProjectItemsOfKinds } from './useItemQueries'

/**
 * The items that each stage works on one after another, by the key of the stage: for each artifact
 * kind with one artifact for each subject, the items of its subject kind, in the order of their
 * keys, each with the title its kind schema names. Empty while they load.
 */
export function useStageSubjects(
  projectId: string,
  version: number | undefined,
): ReadonlyMap<string, StageSubject[]> {
  const { data: definition } = useWorkflowDefinition(version)
  const titleOf = useItemTitleOf()
  const subjectsOfStage = useMemo(() => {
    const ofStage = new Map<string, string>()
    for (const kind of definition?.artifact_kinds ?? []) {
      if (kind.per_project === 'one_per_subject' && kind.subject_item_kind !== null) {
        ofStage.set(kind.stage, kind.subject_item_kind)
      }
    }
    return ofStage
  }, [definition])
  const stages = useMemo(() => [...subjectsOfStage.entries()], [subjectsOfStage])
  const itemsOfKind = useProjectItemsOfKinds(
    projectId,
    stages.map(([, kind]) => kind),
    { isEnabled: version !== undefined },
  )

  return useMemo(() => {
    const subjects = new Map<string, StageSubject[]>()
    stages.forEach(([stage], index) => {
      subjects.set(
        stage,
        (itemsOfKind[index] ?? []).map((item) => ({
          id: item.id,
          key: item.key,
          title: titleOf(item),
        })),
      )
    })
    return subjects
  }, [stages, itemsOfKind, titleOf])
}
