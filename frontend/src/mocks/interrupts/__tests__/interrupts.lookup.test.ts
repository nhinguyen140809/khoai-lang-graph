import { describe, expect, it } from 'vitest'

import type { Run } from '@/modules/run/entities'
import { assertPresent } from '@/shared/lib/guards'
import { openPage } from '@/test/msw'

import { artifactRefOf } from '../../artifacts/artifact-refs.utils'
import { artifactFixtureByKind } from '../../artifacts/fixtures/artifacts.fixtures'
import { allRuns, findRun, stepsOfRun } from '../../runs/lookup/runs.lookup'
import { changeRun } from '../../runs/runs.changes'
import { projectIds, runIds } from '../../shared/db'
import { interruptsOfRun, pendingInterruptOf } from '../interrupts.lookup'
import { interruptEdits } from '../interrupts.store'
import { agentQuestionCases, run3InterruptCases } from './interrupts.lookup.data'

// Run 3 of the mentor thread, the run of the API examples, as the mock server holds it.
function run3(): Run {
  return assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
}

describe('interruptsOfRun', () => {
  it.each(run3InterruptCases)(
    'reads the checkpoints that the run reached when it $name',
    ({ address, interrupts }) => {
      openPage(address)

      expect(interruptsOfRun(run3()).map(({ node, status }) => ({ node, status }))).toEqual(
        interrupts,
      )
    },
  )

  it('reads what run 3 waits for, with the analysis under review', () => {
    const pending = pendingInterruptOf(run3())
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
    const step = stepsOfRun(runIds.mentorMain3).find(({ node }) => node === 'checkpoint_analysis')

    expect(pending).toMatchObject({
      run_id: runIds.mentorMain3,
      node: 'checkpoint_analysis',
      step_id: step?.id,
      prompt: 'Review the requirements analysis. Accept it, or reject it with feedback.',
      allow_edits: true,
      status: 'pending',
      resolved_at: null,
    })
    expect(pending?.id).not.toBe(pending?.step_id)
    expect(pending?.review_artifacts).toEqual([artifactRefOf(analysis)])
  })

  it('reads the interrupt that a generated run waits for, at the review of its personas', () => {
    const run = allRuns().find(
      ({ status, current_stage }) => status === 'interrupted' && current_stage === 'persona_review',
    )

    const pending = pendingInterruptOf(
      assertPresent(run, 'A generated run waits at the review of its personas.'),
    )
    expect(pending).toMatchObject({ node: 'checkpoint_personas', status: 'pending' })
    expect(pending?.review_artifacts.map(({ kind }) => kind)).toEqual(['persona_catalog'])
  })

  it('drops the interrupt of a run that was stopped while it waits', () => {
    changeRun(runIds.mentorMain3, { status: 'cancelled' })

    const stopped = assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
    expect(interruptsOfRun(stopped).at(-1)).toMatchObject({
      node: 'checkpoint_analysis',
      status: 'cancelled',
      resolved_at: null,
    })
  })

  it('reads the questions of the definition when no agent adds any', () => {
    const pending = pendingInterruptOf(run3())

    expect(pending?.questions).toEqual([])
    expect(pending?.options.map(({ key }) => key)).toEqual([
      'accept',
      'reject_reanalyse',
      'reject_reinterview',
    ])
  })

  it.each(agentQuestionCases)(
    'reads $name in the pending interrupt',
    ({ address, prompt, options, questions }) => {
      openPage(address)

      const pending = pendingInterruptOf(run3())
      expect(pending).toMatchObject({ prompt })
      expect(pending?.options.map(({ key }) => key)).toEqual(options)
      expect(pending?.questions.map(({ key, source }) => [key, source])).toEqual(
        questions.map((key) => [key, 'agent']),
      )
    },
  )

  it('reads the edit of the store over the step of the run', () => {
    const pending = assertPresent(pendingInterruptOf(run3()), 'Run 3 waits for a review.')
    interruptEdits.set({
      ...interruptEdits.get(),
      [pending.id]: { status: 'resolved', resolved_at: '2026-10-07T09:00:00Z' },
    })

    expect(interruptsOfRun(run3()).find(({ id }) => id === pending.id)).toMatchObject({
      status: 'resolved',
      resolved_at: '2026-10-07T09:00:00Z',
    })
  })
})
