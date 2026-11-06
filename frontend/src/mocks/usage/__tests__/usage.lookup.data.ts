import { projectIds } from '../../shared/db'

/** A month, and what its usage costs without groups. */
export const monthCases = [
  { name: 'October 2026', month: '2026-10', cost: 4.775 },
  { name: 'September 2026', month: '2026-09', cost: 1.944 },
  { name: 'a month without usage', month: '2026-11', cost: 0 },
]

/** A grouping of October 2026: how many groups it has and the first one. */
export const groupingCases = [
  { grouping: 'day', count: 7, first: '2026-10-02' },
  { grouping: 'project', count: 12, first: projectIds.mentor },
  { grouping: 'agent_role', count: 8, first: 'interviewer' },
  { grouping: 'model', count: 2, first: 'anthropic:claude-sonnet-5' },
] as const

/** A scenario of the budget, and the budget of a month that cost $4.775. */
export const budgetCases = [
  { scenario: 'warning', budget: 5.55 },
  { scenario: 'danger', budget: 5.02 },
  { scenario: 'none', budget: null },
]
