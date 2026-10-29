import { buildStep, producedItems } from '@/mocks/runs/fixtures/runs.fixtures'

/** Steps in the order given, and the entries that they make: `1+2+3` is a group of three steps. */
export const groupCases = [
  {
    name: 'consecutive steps on one subject and stage, named by the key of what they made',
    steps: [
      buildStep({ sequence: 1, subject_item_id: 'p1', produced: producedItems(1, 'PER-001#1') }),
      buildStep({ sequence: 2, subject_item_id: 'p1' }),
      buildStep({ sequence: 3, subject_item_id: 'p1' }),
    ],
    entries: ['PER-001: 1+2+3'],
  },
  {
    name: 'a group named by its stage when nothing was produced',
    steps: [
      buildStep({ sequence: 1, subject_item_id: 'p1' }),
      buildStep({ sequence: 2, subject_item_id: 'p1' }),
    ],
    entries: ['interviewing: 1+2'],
  },
  {
    name: 'steps of other subjects, of other stages, or without a subject',
    steps: [
      buildStep({ sequence: 1, subject_item_id: 'p1' }),
      buildStep({ sequence: 2, subject_item_id: 'p2' }),
      buildStep({ sequence: 3, subject_item_id: 'p2', stage: 'analysis' }),
      buildStep({ sequence: 4 }),
      buildStep({ sequence: 5 }),
    ],
    entries: ['1', '2', '3', '4', '5'],
  },
  {
    name: 'steps out of order',
    steps: [buildStep({ sequence: 3 }), buildStep({ sequence: 1 }), buildStep({ sequence: 2 })],
    entries: ['1', '2', '3'],
  },
  { name: 'no steps', steps: [], entries: [] },
]
