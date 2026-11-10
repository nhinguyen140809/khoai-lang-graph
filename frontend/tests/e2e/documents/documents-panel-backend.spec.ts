import { expect } from '@playwright/test'

import { seededProjects } from '../../shared/backend-env.constants'
import { test } from '../../shared/fixtures.utils'
import { openedDocuments, panelDocuments } from './documents-panel-backend.data'

const documentsPage = `/projects/${seededProjects.mentor.id}/documents`

test('lists the documents of a finished project in the side panel', async ({ page, user }) => {
  await page.goto(documentsPage)

  for (const name of panelDocuments) {
    await user.expectRole('treeitem', name)
  }
  const shown = await page.getByRole('treeitem').first().innerText()
  expect(shown).toBe(panelDocuments[0])
})

for (const { name, shows } of openedDocuments) {
  test(`opens ${name} from the side panel in its own tab`, async ({ page, user }) => {
    await page.goto(documentsPage)

    await user.openTreeItem(new RegExp(`^${name}$`))

    await user.expectUrl(new RegExp(`${documentsPage}/[^/]+$`))
    await user.expectRole('heading', name)
    await user.expectRole('heading', shows)
  })
}

test('keeps the open document when the panel changes and comes back', async ({ page, user }) => {
  await page.goto(documentsPage)
  await user.openTreeItem(/^Requirement specification$/)
  await user.expectRole('heading', 'Requirement specification')

  await user.openSidePanel('Trace')
  await user.expectText('Overview')
  await user.openSidePanel('Documents')

  await user.expectRole('treeitem', 'Product backlog')
  await user.expectRole('heading', 'Requirement specification')
})
