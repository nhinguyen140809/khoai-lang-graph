import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'

/** The steps of a run and its status, and the status and visits of each node it names. */
export const nodeCases = [
  {
    name: 'a node visited twice, with its last step',
    steps: [
      buildStep({ sequence: 1, node: 'a' }),
      buildStep({ sequence: 2, node: 'b' }),
      buildStep({ sequence: 3, node: 'a' }),
    ],
    runStatus: 'succeeded' as const,
    nodes: {
      a: { status: 'done', visits: 2, lastStepId: 's3' },
      b: { status: 'done', visits: 1, lastStepId: 's2' },
    },
  },
  {
    name: 'a step that runs while the run is paused',
    steps: [
      buildStep({ sequence: 1, node: 'a' }),
      buildStep({ sequence: 2, node: 'checkpoint', status: 'running' }),
    ],
    runStatus: 'interrupted' as const,
    nodes: { checkpoint: { status: 'waiting', visits: 1, lastStepId: 's2' } },
  },
  {
    name: 'a step that runs while the run works',
    steps: [
      buildStep({ sequence: 1, node: 'a' }),
      buildStep({ sequence: 2, node: 'checkpoint', status: 'running' }),
    ],
    runStatus: 'running' as const,
    nodes: { checkpoint: { status: 'running', visits: 1, lastStepId: 's2' } },
  },
  {
    name: 'a failed step',
    steps: [buildStep({ sequence: 1, node: 'a', status: 'failed' })],
    runStatus: 'failed' as const,
    nodes: { a: { status: 'failed', visits: 1, lastStepId: 's1' } },
  },
  {
    name: 'a skipped step',
    steps: [buildStep({ sequence: 1, node: 'a', status: 'skipped' })],
    runStatus: 'succeeded' as const,
    nodes: { a: { status: 'done', visits: 1, lastStepId: 's1' } },
  },
]

/** The steps of a run, and the edge between the last two steps. */
export const edgeCases = [
  { name: 'no step', steps: [], edge: null },
  { name: 'one step', steps: [buildStep({ sequence: 1, node: 'a' })], edge: null },
  {
    name: 'the last two steps of one node',
    steps: [buildStep({ sequence: 1, node: 'a' }), buildStep({ sequence: 2, node: 'a' })],
    edge: null,
  },
  {
    name: 'the last two steps of two nodes',
    steps: [
      buildStep({ sequence: 1, node: 'a' }),
      buildStep({ sequence: 2, node: 'b' }),
      buildStep({ sequence: 3, node: 'a' }),
    ],
    edge: { source: 'b', target: 'a' },
  },
  {
    name: 'steps out of order',
    steps: [buildStep({ sequence: 2, node: 'b' }), buildStep({ sequence: 1, node: 'a' })],
    edge: { source: 'a', target: 'b' },
  },
]
