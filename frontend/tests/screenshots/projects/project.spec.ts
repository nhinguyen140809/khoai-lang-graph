import type { Page } from '@playwright/test'

import { projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'
import type { UserSteps } from '../../shared/steps'
import { screenshots } from '../screenshot.utils'

const mentor = `/projects/${projectIds.mentor}/activity`

async function openProjectMenu(page: Page, user: UserSteps) {
  await page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('button').click()
  await user.expectRole('menu')
}

async function openCommandPalette(user: UserSteps) {
  await user.pressButton('Search or run a command')
  await user.expectRole('dialog', 'Command palette')
}

screenshots('Project', (shot) => {
  shot.at('Frame of the mentor platform', mentor)

  shot('Project menu', async ({ page, user, shoot }) => {
    await page.goto(mentor)

    await openProjectMenu(page, user)
    await shoot()
  })

  shot('Project menu while the project loads', async ({ page, user, shoot }) => {
    await page.goto(`${mentor}?mock-project=loading`)

    await openProjectMenu(page, user)
    await shoot()
  })

  shot('Project menu when the project fails to load', async ({ page, user, shoot }) => {
    await page.goto(`${mentor}?mock-project=error`)

    await openProjectMenu(page, user)
    await user.expectRole('menuitem', 'Load the project again')
    await shoot()
  })

  shot('Project menu while the projects load', async ({ page, user, shoot }) => {
    await page.goto(`${mentor}?mock-projects=loading`)

    await openProjectMenu(page, user)
    await shoot()
  })

  shot('Project menu when the projects fail to load', async ({ page, user, shoot }) => {
    await page.goto(`${mentor}?mock-projects=error`)

    await openProjectMenu(page, user)
    await user.expectRole('menuitem', /Failed to load projects/)
    await shoot()
  })

  shot('Command palette', async ({ page, user, shoot }) => {
    await page.goto(mentor)

    await openCommandPalette(user)
    await shoot()
  })

  shot('Command palette with a search', async ({ page, user, shoot }) => {
    await page.goto(mentor)

    await openCommandPalette(user)
    await user.typeText('project')
    await shoot()
  })

  shot('Command palette while the projects load', async ({ page, user, shoot }) => {
    await page.goto(`${mentor}?mock-projects=loading`)

    await openCommandPalette(user)
    await shoot()
  })

  shot('Command palette when the projects fail to load', async ({ page, user, shoot }) => {
    await page.goto(`${mentor}?mock-projects=error`)

    await openCommandPalette(user)
    await user.expectRole('option', /Failed to load projects/)
    await shoot()
  })

  shot('Notifications', async ({ page, user, shoot }) => {
    await page.goto(mentor)

    await user.pressButton('Notifications')
    await user.expectText('Nothing new.')
    await shoot()
  })

  shot.at('Project not found', '/projects/missing/activity')

  shot('Rename project from the project menu', async ({ page, user, shoot }) => {
    await page.goto(mentor)

    await openProjectMenu(page, user)
    await user.pressMenuItem('Rename project')
    await user.expectRole('dialog', 'Rename project')
    await shoot()
  })

  shot('Rename project in the command palette', async ({ page, user, shoot }) => {
    await page.goto(mentor)

    await openCommandPalette(user)
    await user.typeText('rename')
    await shoot()
  })
})
