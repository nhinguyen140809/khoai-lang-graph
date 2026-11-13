import { expect } from '@playwright/test'

import { expectOk } from '../../shared/api'
import { seededProjects } from '../../shared/backend-env.constants'
import { test } from '../../shared/fixtures.utils'
import { overviewRows } from './trace-panel-backend.data'

interface Coverage {
  gaps: { key: string; title: string; items: { key: string; title: string }[] }[]
}

const tracePage = `/projects/${seededProjects.mentor.id}/trace`

test('shows in the overview the number of items that each gap of the API holds', async ({
  client,
  page,
  user,
}) => {
  const coverage = expectOk(
    await client.get<Coverage>(`/projects/${seededProjects.mentor.id}/traceability/coverage`),
  )
  await page.goto(tracePage)
  await user.openSidePanel('Trace')

  for (const { key, label } of overviewRows) {
    const gap = coverage.gaps.find((entry) => entry.key === key)
    const row = page.getByRole('treeitem', { name: new RegExp(label) })
    await expect(row).toContainText(String(gap?.items.length ?? 0))
  }
})

test('lists the documents and their items under the overview', async ({ page, user }) => {
  await page.goto(tracePage)
  await user.openSidePanel('Trace')

  await user.expectText('Overview')
  await user.expectRole('treeitem', 'Requirement specification')
  await user.expectRole('treeitem', 'Elicitation plan')
})

test('opens the requirements that no user story covers from the overview', async ({
  client,
  page,
  user,
}) => {
  const coverage = expectOk(
    await client.get<Coverage>(`/projects/${seededProjects.mentor.id}/traceability/coverage`),
  )
  const uncovered = coverage.gaps.find((gap) => gap.key === 'no_backlog_item')?.items[0]
  await page.goto(tracePage)
  await user.openSidePanel('Trace')

  await user.openTreeItem(/Requirements without a user story/)

  await user.expectRole('heading', 'Requirements without a user story')
  await expect(page.getByText(uncovered?.title ?? '').first()).toBeVisible()
})
