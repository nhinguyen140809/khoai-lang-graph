import { type UsageGrouping, usageGroupings } from '@/modules/usage/entities'

import { choice } from '../shared/http/validation'
import { mockUsageMonth } from './usage.constants'

// What the query of the request for the usage may hold. The checks are the rules of the API.

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

/** The month and the grouping that the query asks for; else the problem to answer with. */
export function validateUsageQuery(
  query: URLSearchParams,
): { month: string; grouping: UsageGrouping | null } | { problem: string } {
  const month = query.get('month') ?? mockUsageMonth
  if (!monthPattern.test(month)) return { problem: 'Send the month as YYYY-MM.' }
  const groupBy = query.get('group_by')
  if (groupBy === null) return { month, grouping: null }
  const grouping = choice(usageGroupings, groupBy)
  if (grouping === undefined)
    return { problem: 'Choose day, project, agent_role or model to group by.' }
  return { month, grouping }
}
