import { buildRun, defaultRunConfigFixture, noUsage } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, threadIds } from '@/mocks/shared/db'
import type { CostShare } from '@/shared/lib/cost'

import type { Run } from '../../runs.types'

// A run of the mentor thread that has cost `costUsd` against the limit `maxCostUsd` of the run.
function runCosting(costUsd: number, maxCostUsd: number | null): Run {
  return buildRun({
    id: 'run-cost',
    thread_id: threadIds.mentorMain,
    project_id: projectIds.mentor,
    number: 1,
    usage: { ...noUsage, cost_usd: costUsd },
    run_config: { ...defaultRunConfigFixture, max_cost_usd: maxCostUsd },
  })
}

/** The runs that the API answers with, and the cost of the newest run against the limit of the run. */
export const runCostCases: { name: string; runs: Run[]; share: CostShare | undefined }[] = [
  {
    name: 'a cost near its limit',
    runs: [runCosting(1.72, 2)],
    share: { costUsd: 1.72, limitUsd: 2, percent: 86, level: 'warning' },
  },
  { name: 'nothing for a run without a limit', runs: [runCosting(1.72, null)], share: undefined },
  { name: 'nothing for a thread without a run', runs: [], share: undefined },
]
