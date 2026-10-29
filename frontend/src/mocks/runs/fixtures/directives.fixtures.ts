import type { Directive } from '@/modules/run/entities'
import { assertPresent } from '@/shared/lib/guards'

import { itemFixtureByKey } from '../../artifacts/fixtures/artifacts.fixtures'
import { IdPrefix, mockId, projectIds, runIds } from '../../shared/db'
import { runStepFixtures } from './runs.fixtures'

// The directives of the first run of the mentor thread: the user asked at the analysis review to
// interview a persona again about a conflict, then the intent router passed on a message of the
// user.

function itemRefOf(key: string) {
  const { id, kind, version } = itemFixtureByKey(projectIds.mentor, key)
  return { item_id: id, kind, key, version }
}

const analystStep = assertPresent(
  runStepFixtures(runIds.mentorMain1, 'done').find(({ node }) => node === 'analyst'),
  'The first run of the mentor thread has no analyst step',
)

/** The directives of the runs of the mock data. */
export const directiveFixtures: Directive[] = [
  {
    id: mockId(IdPrefix.Directive, 1),
    run_id: runIds.mentorMain1,
    kind: 'rework',
    issued_by_step_id: null,
    human_decision_id: mockId(IdPrefix.Decision, 1),
    target_node: 'interviewer',
    iteration: 1,
    instruction: 'Clarify CONF-001: would a layered design work?',
    items: [
      { item: itemRefOf('PER-001'), role: 'addressed_to' },
      { item: itemRefOf('CONF-001'), role: 'about' },
    ],
    details: {},
    created_at: '2026-10-02T08:41:12Z',
  },
  {
    id: mockId(IdPrefix.Directive, 2),
    run_id: runIds.mentorMain1,
    kind: 'intent',
    issued_by_step_id: analystStep.id,
    human_decision_id: null,
    target_node: 'analyst',
    iteration: 2,
    instruction: 'Check the first requirement again.',
    items: [{ item: itemRefOf('REQ-001'), role: 'about' }],
    details: {},
    created_at: '2026-10-02T08:55:40Z',
  },
]
