import type { Page } from '@playwright/test'

import { IdPrefix, projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'
import { mockId } from '../../../src/mocks/shared/db/mock-ids.utils'
import { screenshots } from '../screenshot.utils'

const project = `/projects/${projectIds.mentor}`
// The artifacts of the mentor platform are numbered in the order of the fixtures.
const artifactId = (position: number) => mockId(IdPrefix.Artifact, 100 + position)
const plan = artifactId(1)
const persona = artifactId(2)
const interview = artifactId(3)
const analysis = artifactId(6)
const specification = artifactId(7)

/** Opens an item from the outline of its document, as a user does. */
async function openItem(page: Page, artifact: string, title: string) {
  await page.goto(`${project}/documents/${artifact}`)
  await page.getByRole('treeitem', { name: title }).click()
  await page.getByRole('group', { name: 'Go through the items' }).waitFor()
}

const statedNeed = { name: 'Stated need', exact: true } as const

screenshots('Documents', (shot) => {
  /** Opens the address and takes the shot once an element with the role and the name is there. */
  const shotWhenReady = (
    name: string,
    path: string,
    ready: { role: 'button' | 'treeitem'; name: string },
  ) => {
    shot(name, async ({ page, user, shoot }) => {
      await page.goto(`${project}${path}`)

      await user.expectRole(ready.role, ready.name)
      await shoot()
    })
  }

  const itemShot = (name: string, artifact: string, title: string) => {
    shot(name, async ({ page, shoot }) => {
      await openItem(page, artifact, title)
      await shoot()
    })
  }

  itemShot('Item that is rejected', analysis, 'Approve a booking too')
  itemShot('Item edited by the user', analysis, 'Reminder before a session')
  itemShot('Item with an open issue', analysis, 'Session length unknown')
  itemShot('Item in an approved document', specification, 'Search mentors')

  shot('Side panel with the outline of the analysis', async ({ page, shoot }) => {
    await page.goto(`${project}/documents/${analysis}`)

    await page.getByRole('treeitem', statedNeed).waitFor()
    await shoot()
  })

  shot.at('Document of the analysis', `${project}/documents/${analysis}`)

  shot('Item of the analysis', async ({ page, user, shoot }) => {
    await openItem(page, analysis, 'Find a mentor in my field')

    await user.expectRole('group', 'Go through the items')
    await shoot()
  })

  shotWhenReady(
    'Side panel while the run writes the analysis',
    '/documents?mock-run-status=running',
    { role: 'treeitem', name: 'Requirements analysis' },
  )
  shotWhenReady(
    'Side panel with every kind not started',
    '/documents?mock-artifacts=empty&mock-run-status=running',
    { role: 'treeitem', name: 'Interview plan' },
  )

  shot.at('Documents', `${project}/documents`)

  shot.at('Document with sections and tables', `${project}/documents/${specification}`, {
    fullPage: true,
  })
  shot.at('Document with cards', `${project}/documents/${persona}`)
  shot.at('Document with a transcript', `${project}/documents/${interview}`, { fullPage: true })
  shot.at('Document without items', `${project}/documents/${plan}`)
  shot.at('Document of the analysis in full', `${project}/documents/${analysis}`, {
    fullPage: true,
  })
  shotWhenReady('Document that fails to load', `/documents/${analysis}?mock-artifact=error`, {
    role: 'button',
    name: 'Try again',
  })
  shot.at('Document that loads', `${project}/documents/${analysis}?mock-artifact=loading`)
  shot.at('Document that does not exist', `${project}/documents/missing`)
  shot.at('Item that does not exist', `${project}/items/missing`)
  shotWhenReady('Panel that fails to load', '/documents?mock-artifacts=error', {
    role: 'button',
    name: 'Try again',
  })
  shot.at('Panel that loads', `${project}/documents?mock-artifacts=loading`)
  shot.at(
    'Panel without documents',
    `${project}/documents?mock-artifacts=empty&mock-run-status=done`,
  )
  shot.at('Panel with a failed run', `${project}/documents?mock-run-status=failed`)
  shot.at('Panel with a finished run', `${project}/documents?mock-run-status=done`)

  shot('Outline with a group collapsed', async ({ page, shoot }) => {
    await page.goto(`${project}/documents/${analysis}`)

    await page.getByRole('treeitem', statedNeed).click()
    await page.getByRole('treeitem', statedNeed).waitFor()
    await shoot()
  })

  shot('Tooltip of a row', async ({ page, user, shoot }) => {
    await page.goto(`${project}/documents/${analysis}`)

    const row = page.getByRole('treeitem', { name: 'Session length unknown' })
    await row.hover()
    await user.expectRole('tooltip')
    await shoot({ hover: row })
  })

  shot('Activity bar item under the pointer', async ({ page, shoot }) => {
    await page.goto(`${project}/documents/${analysis}`)

    // Hiding the side panel leaves the item unselected, so the pointer shows on it.
    const item = page.getByRole('navigation', { name: 'Features' }).getByRole('button')
    await item.first().click()
    await item.first().hover()
    await shoot({ hover: item.first() })
  })

  shot('Tooltip of the budget of the month', async ({ page, user, shoot }) => {
    await page.goto(`${project}/documents/${analysis}?mock-budget=warning`)

    const budget = page.getByRole('contentinfo').getByRole('group')
    await budget.hover()
    await user.expectRole('tooltip')
    await shoot({ hover: budget })
  })

  shot('Outline of a document with sections', async ({ page, shoot }) => {
    await page.goto(`${project}/documents/${specification}`)

    await page.getByRole('treeitem', { name: 'Functional requirements', exact: true }).waitFor()
    await shoot()
  })

  shotWhenReady('Panel with a transcript open', `/documents/${interview}`, {
    role: 'treeitem',
    name: 'Interview with the student',
  })
  shotWhenReady('Outline that fails to load', `/documents/${analysis}?mock-artifact=error`, {
    role: 'treeitem',
    name: 'The outline could not load.',
  })

  shot('Document row under the pointer', async ({ page, user, shoot }) => {
    await page.goto(`${project}/documents/${analysis}`)

    // A row with no color of its own: its icon and title go from muted to the text color.
    const row = page.getByRole('treeitem', { name: 'Persona catalog' })
    await user.expectRole('treeitem', 'Persona catalog')
    await row.hover()
    await shoot({ hover: row })
  })
})
