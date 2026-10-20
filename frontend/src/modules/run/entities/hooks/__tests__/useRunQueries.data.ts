/** What the latest run of a thread has cost of its limit of $2.00, and the share that gives. */
export const runCostCases = [
  {
    name: 'a run that has spent little of its limit',
    costUsd: 0.06,
    cost: { percent: 3, level: 'normal' },
  },
  { name: 'a run near its limit', costUsd: 1.72, cost: { percent: 86, level: 'warning' } },
  {
    name: 'a run that has nearly spent its limit',
    costUsd: 1.9,
    cost: { percent: 95, level: 'danger' },
  },
]
