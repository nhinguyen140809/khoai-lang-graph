import { describe, expect, it } from 'vitest'

import type { Usage } from '@/modules/usage/entities'
import { openPage } from '@/test/msw'

import { currentUser } from '../../account/account.store'
import { budgetOfMonth, usageOfMonth } from '../usage.lookup'
import { budgetCases, groupingCases, monthCases } from './usage.lookup.data'

describe('usageOfMonth', () => {
  it.each(monthCases)('sums the steps of $name', ({ month, cost }) => {
    const usage = usageOfMonth(month, null)

    expect(usage.month).toBe(month)
    expect(usage.total.cost_usd).toBeCloseTo(cost, 6)
    expect(usage.groups).toEqual([])
  })

  it('has every field at zero for a month without usage', () => {
    expect(usageOfMonth('2026-11', 'day').total).toEqual({
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
      cost_usd: 0,
      duration_ms: 0,
    })
  })

  describe.each(groupingCases)('grouped by $grouping', ({ grouping, count, first }) => {
    const usage = usageOfMonth('2026-10', grouping)

    it('has one group for each key, the first one first', () => {
      expect(usage.groups).toHaveLength(count)
      expect(usage.groups[0]?.key).toBe(first)
    })

    it('orders the days by key and the others by cost, then key', () => {
      const keys = usage.groups.map(({ key }) => key)
      if (grouping === 'day') {
        expect(keys).toEqual(keys.toSorted())
        return
      }
      const costs = usage.groups.map((group) => group.usage.cost_usd)
      expect(costs).toEqual(costs.toSorted((a, b) => b - a))
    })

    it('adds up to the cost and the tokens of the total', () => {
      const sum = (pick: (value: Usage) => number) =>
        usage.groups.reduce((acc, group) => acc + pick(group.usage), 0)

      expect(sum((value) => value.cost_usd)).toBeCloseTo(usage.total.cost_usd, 6)
      expect(sum((value) => value.input_tokens)).toBe(usage.total.input_tokens)
      expect(sum((value) => value.output_tokens)).toBe(usage.total.output_tokens)
      if (grouping === 'agent_role' || grouping === 'model') {
        expect(sum((value) => value.duration_ms)).toBeLessThan(usage.total.duration_ms)
      }
    })
  })
})

describe('budgetOfMonth', () => {
  it('is the budget that the server gives a user without one', () => {
    expect(budgetOfMonth(4.775)).toBe(20)
  })

  it('is the budget of the user when there is one', () => {
    currentUser.set({ ...currentUser.get(), monthly_budget_usd: 50 })

    expect(budgetOfMonth(4.775)).toBe(50)
  })

  it.each(budgetCases)('is $budget in the $scenario scenario', ({ scenario, budget }) => {
    openPage(`/?mock-budget=${scenario}`)

    expect(budgetOfMonth(4.775)).toBe(budget)
  })

  it('keeps the budget of the user for a month without cost', () => {
    openPage('/?mock-budget=warning')

    expect(budgetOfMonth(0)).toBe(20)
  })
})
