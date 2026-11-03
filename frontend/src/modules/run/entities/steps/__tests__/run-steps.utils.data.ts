import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'

/** The steps of a run in the order given, and the sequences in the order they ran. */
export const orderCases = [
  {
    name: 'steps in order',
    steps: [buildStep({ sequence: 1 }), buildStep({ sequence: 2 })],
    sequences: [1, 2],
  },
  {
    name: 'steps out of order',
    steps: [buildStep({ sequence: 3 }), buildStep({ sequence: 1 }), buildStep({ sequence: 2 })],
    sequences: [1, 2, 3],
  },
  { name: 'no steps', steps: [], sequences: [] },
]
