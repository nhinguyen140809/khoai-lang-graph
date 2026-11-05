import type { MonthlyUsage, Usage, UsageGroup, UsageGrouping } from '@/modules/usage/entities'
import { collectBy } from '@/shared/lib/collections'

import { currentUser } from '../account/account.store'
import { allRuns, stepsOfRun } from '../runs/lookup/runs.lookup'
import { pageUrlParam } from '../shared/scenario'
import {
  budgetShares,
  centsPerDollar,
  costStepsPerDollar,
  isoDayLength,
  serverBudgetUsd,
} from './usage.constants'

// The usage of the user as the mock server sums it: the steps of the runs that started in a month.
// The usage written on a run itself is not read, so the total and each grouping add up.

interface MonthStep {
  projectId: string
  startedAt: string
  agentRole: string | null
  modelId: string | null
  usage: Usage
}

/** The costs are rounded to the millionth of a dollar, to drop the error of the float sums. */
function roundedCost(usd: number): number {
  return Math.round(usd * costStepsPerDollar) / costStepsPerDollar
}

/** The steps that started in the month, in UTC, with the project of their run. */
function stepsOfMonth(month: string): MonthStep[] {
  return allRuns().flatMap((run) =>
    stepsOfRun(run.id)
      .filter((step) => step.started_at.startsWith(`${month}-`))
      .map((step) => ({
        projectId: run.project_id,
        startedAt: step.started_at,
        agentRole: step.agent_role,
        modelId: step.model_id,
        usage: step.usage,
      })),
  )
}

function sumUsage(usages: Usage[]): Usage {
  const total = usages.reduce<Usage>(
    (sum, usage) => ({
      input_tokens: sum.input_tokens + usage.input_tokens,
      output_tokens: sum.output_tokens + usage.output_tokens,
      cache_read_tokens: sum.cache_read_tokens + usage.cache_read_tokens,
      cache_write_tokens: sum.cache_write_tokens + usage.cache_write_tokens,
      cost_usd: sum.cost_usd + usage.cost_usd,
      duration_ms: sum.duration_ms + usage.duration_ms,
    }),
    {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
      cost_usd: 0,
      duration_ms: 0,
    },
  )
  return { ...total, cost_usd: roundedCost(total.cost_usd) }
}

/** The key of the group a step counts in; null for a step that calls no LLM in a grouping by it. */
function groupKey(grouping: UsageGrouping, step: MonthStep): string | null {
  switch (grouping) {
    case 'day':
      return step.startedAt.slice(0, isoDayLength)
    case 'project':
      return step.projectId
    case 'agent_role':
      return step.agentRole
    case 'model':
      return step.modelId
  }
}

/** The days by key; the other groupings by cost, the highest first, then by key. */
function byGroupOrder(grouping: UsageGrouping): (a: UsageGroup, b: UsageGroup) => number {
  if (grouping === 'day') return (a, b) => a.key.localeCompare(b.key)
  return (a, b) => b.usage.cost_usd - a.usage.cost_usd || a.key.localeCompare(b.key)
}

function groupsOf(grouping: UsageGrouping, steps: MonthStep[]): UsageGroup[] {
  const usagesByKey = collectBy(
    steps,
    (step) => groupKey(grouping, step),
    ({ usage }) => usage,
  )
  return [...usagesByKey]
    .map(([key, usages]) => ({ key, usage: sumUsage(usages) }))
    .toSorted(byGroupOrder(grouping))
}

/**
 * The budget of the month: the one of the user, else the one of the server. With `?mock-budget=`
 * it is `none` (no limit), or a budget that the cost of the month spends 86% (`warning`) or 95%
 * (`danger`) of, rounded down to the cent; a month without cost keeps the budget of the user.
 */
export function budgetOfMonth(costUsd: number): number | null {
  const scenario = pageUrlParam('mock-budget')
  if (scenario === 'none') return null
  if ((scenario === 'warning' || scenario === 'danger') && costUsd > 0) {
    return Math.floor((costUsd / budgetShares[scenario]) * centsPerDollar) / centsPerDollar
  }
  return currentUser.get().monthly_budget_usd ?? serverBudgetUsd
}

/** The usage of a month, with its groups when `grouping` is given. */
export function usageOfMonth(
  month: string,
  grouping: UsageGrouping | null,
  steps: MonthStep[] = stepsOfMonth(month),
): MonthlyUsage {
  const total = sumUsage(steps.map((step) => step.usage))
  return {
    month,
    budget_usd: budgetOfMonth(total.cost_usd),
    total,
    groups: grouping === null ? [] : groupsOf(grouping, steps),
  }
}
