import { describe, expect, it } from 'vitest'

import type { Interrupt, ResumeRunBody } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'
import { assertPresent } from '@/shared/lib/guards'
import { openPage } from '@/test/msw'

import {
  allItems,
  artifactRevisions,
  findArtifact,
  findItem,
  itemRevisions,
} from '../../artifacts/artifacts.lookup'
import { artifactFixtureByKind } from '../../artifacts/fixtures/artifacts.fixtures'
import { findRun } from '../../runs/lookup/runs.lookup'
import { projectIds, runIds } from '../../shared/db'
import { resolveInterrupt } from '../interrupts.changes'
import { pendingInterruptOf } from '../interrupts.lookup'

// Run 3 of the mentor thread, and the review it waits for: the analysis, with its options.
function run3(): Run {
  return assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
}

function pendingReview(): Interrupt {
  return assertPresent(pendingInterruptOf(run3()), 'Run 3 waits for a review.')
}

// The decision that answers the review with an option, and nothing else.
function answerOf(pending: Interrupt, option: string | null): ResumeRunBody {
  return { interrupt_id: pending.id, option, feedback: null, answers: {}, modified_items: [] }
}

describe('resolveInterrupt', () => {
  it('approves the artifacts under review and their draft items, each as a new version', () => {
    const pending = pendingReview()
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
    const drafts = allItems().filter(
      (item) => item.artifact_id === analysis.id && item.review_status === 'draft',
    )
    const personas = artifactFixtureByKind(projectIds.mentor, 'persona_catalog')

    resolveInterrupt(run3(), pending, answerOf(pending, 'accept'))

    const approved = findArtifact(analysis.id)
    expect(approved).toMatchObject({ review_status: 'approved', version: analysis.version + 1 })
    expect(artifactRevisions(assertPresent(approved, 'The analysis exists.')).at(0)).toMatchObject({
      change_reason: 'reviewed',
    })
    expect(drafts.length).toBeGreaterThan(0)
    for (const draft of drafts) {
      const item = findItem(draft.id)
      expect(item).toMatchObject({ review_status: 'approved', version: draft.version + 1 })
      expect(itemRevisions(assertPresent(item, 'The item exists.')).at(0)).toMatchObject({
        change_reason: 'reviewed',
      })
    }
    // The artifacts that are not under review keep their version and their status.
    expect(findArtifact(personas.id)).toMatchObject({
      review_status: 'approved',
      version: personas.version,
    })
  })

  it('approves nothing on a reject, and sends the run back to the stage of the option', () => {
    const pending = pendingReview()
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')

    resolveInterrupt(run3(), pending, answerOf(pending, 'reject_reinterview'))

    expect(findArtifact(analysis.id)).toMatchObject({ review_status: 'draft' })
    expect(findRun(runIds.mentorMain3)).toMatchObject({
      status: 'running',
      current_stage: 'interviewing',
    })
  })

  it('takes the first edge of a checkpoint that offers no options', () => {
    openPage('/?mock-agent-questions=only')
    const pending = pendingReview()

    resolveInterrupt(run3(), pending, answerOf(pending, null))

    expect(findRun(runIds.mentorMain3)).toMatchObject({
      status: 'running',
      current_stage: 'specification',
    })
  })
})
