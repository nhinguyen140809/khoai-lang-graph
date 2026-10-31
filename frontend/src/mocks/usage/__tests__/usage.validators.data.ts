import type { UsageGrouping } from '@/modules/usage/entities'

const monthProblem = 'Send the month as YYYY-MM.'
const groupProblem = 'Choose day, project, agent_role or model to group by.'

/** A query that the API reads, and the month and grouping it gives. */
export const acceptedCases: {
  name: string
  query: string
  month: string
  grouping: UsageGrouping | null
}[] = [
  { name: 'no parameter', query: '', month: '2026-10', grouping: null },
  { name: 'a month', query: 'month=2026-01', month: '2026-01', grouping: null },
  { name: 'day', query: 'group_by=day', month: '2026-10', grouping: 'day' },
  { name: 'project', query: 'group_by=project', month: '2026-10', grouping: 'project' },
  { name: 'agent_role', query: 'group_by=agent_role', month: '2026-10', grouping: 'agent_role' },
  { name: 'model', query: 'group_by=model', month: '2026-10', grouping: 'model' },
]

/** A query that the API refuses, and the problem it answers with. */
export const refusedCases = [
  { name: 'month 13', query: 'month=2026-13', problem: monthProblem },
  { name: 'a month without its zero', query: 'month=2026-1', problem: monthProblem },
  { name: 'a month that is a word', query: 'month=abc', problem: monthProblem },
  { name: 'an empty month', query: 'month=', problem: monthProblem },
  { name: 'a grouping out of the list', query: 'group_by=week', problem: groupProblem },
  { name: 'an empty grouping', query: 'group_by=', problem: groupProblem },
]
