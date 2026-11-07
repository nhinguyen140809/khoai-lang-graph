'use client'

import { useMemo } from 'react'

import { subjectTitlesOf, useStageSubjects } from '@/modules/artifact/entities/@x/activity'
import { useRunInterrupts } from '@/modules/review/entities/@x/activity'
import { type Run, useRunSteps, workEntries } from '@/modules/run/entities/@x/activity'
import type { Message } from '@/modules/thread/entities/@x/activity'
import {
  kindSchemasByKind,
  useArtifactKinds,
  useStageTitles,
} from '@/modules/workflow/entities/@x/activity'
import { useView } from '@/shared/lib/view'

import type { ActivityEntry, RunEntriesResult } from '../activity-entries.types'
import { runEntries } from '../activity-entries.utils'

/**
 * The entries of a run: its messages, its work and its reviews, with the titles they read. Only a
 * reload of what it reads, a new message or a switch of the view computes the entries again. No
 * query polls: the stream of the activity loads them again while the run works.
 */
export function useRunEntries(
  run: Run,
  messages: readonly Message[],
  projectId: string,
): RunEntriesResult {
  const steps = useRunSteps(run.id)
  const interrupts = useRunInterrupts(run.id)
  const stageTitles = useStageTitles(run.workflow_version)
  const subjects = useStageSubjects(projectId, run.workflow_version)
  const { data: kinds } = useArtifactKinds()
  const view = useView()
  const stepPages = steps.data?.pages
  const interruptPages = interrupts.data?.pages
  const isError = steps.isError || interrupts.isError
  const { refetch: refetchSteps } = steps
  const { refetch: refetchInterrupts } = interrupts

  return useMemo<RunEntriesResult>(() => {
    if (isError) {
      return {
        state: 'error',
        retry: () => {
          void refetchSteps()
          void refetchInterrupts()
        },
      }
    }
    if (stepPages === undefined || interruptPages === undefined) return { state: 'pending' }

    const kindSchemas = kindSchemasByKind(kinds)
    const subjectTitles = subjectTitlesOf(subjects)
    const entries: ActivityEntry[] = runEntries({
      messages,
      work: workEntries(
        stepPages.flatMap(({ items }) => items),
        run,
      ),
      interrupts: interruptPages.flatMap(({ items }) => items),
      stageTitles,
      subjectTitles,
      kindTitles: new Map([...kindSchemas].map(([kind, { schema }]) => [kind, schema.title])),
      view,
    })
    return { state: 'success', entries }
  }, [
    isError,
    refetchSteps,
    refetchInterrupts,
    stepPages,
    interruptPages,
    stageTitles,
    subjects,
    kinds,
    messages,
    run,
    view,
  ])
}
