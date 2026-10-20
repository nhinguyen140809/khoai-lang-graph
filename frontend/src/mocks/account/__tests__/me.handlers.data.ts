/** GET /me in the scenario of the page address: the status and the fields it answers. */
export const meCases = [
  {
    name: 'the signed-in user',
    address: '/',
    status: 200,
    body: { email: 'linh.pham@example.com', display_name: 'Linh Pham' },
  },
  {
    name: '500 in the error scenario',
    address: '/?mock-me=error',
    status: 500,
    body: { code: 'internal_error' },
  },
  {
    name: '404 in the empty scenario',
    address: '/?mock-me=empty',
    status: 404,
    body: { code: 'not_found', detail: 'The user does not exist.' },
  },
]

/** GET /me/usage in the scenario of the page address: the status and the fields it answers. */
export const monthlyUsageCases = [
  {
    name: 'the usage of the month of the mock data, under its budget',
    address: '/',
    status: 200,
    body: { month: '2026-10', budget_usd: 20, groups: [] },
  },
  {
    name: 'a budget near its limit',
    address: '/?mock-budget=warning',
    status: 200,
    body: { budget_usd: 20, total: { cost_usd: 17.2 } },
  },
  {
    name: 'a budget nearly spent',
    address: '/?mock-budget=danger',
    status: 200,
    body: { budget_usd: 20, total: { cost_usd: 19 } },
  },
  {
    name: '500 in the error scenario',
    address: '/?mock-usage=error',
    status: 500,
    body: { code: 'internal_error' },
  },
]
