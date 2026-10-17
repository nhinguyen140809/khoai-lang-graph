import { expect, type Page } from '@playwright/test'

import { PROJECT_IDS } from '../../../src/mocks/shared/mock-ids.constants'
import { type Shot, visit } from '../screenshot.utils'

const mentor = `/projects/${PROJECT_IDS.mentor}/activity`

async function openProjectMenu(page: Page, address: string) {
  await page.goto(address)
  await page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('button').click()
  await expect(page.getByRole('menu')).toBeVisible()
}

async function openCommandPalette(page: Page, address = mentor) {
  await page.goto(address)
  await page.getByRole('button', { name: 'Search or run a command' }).click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
}

/** The states of the frame of a project and of its menus, and the steps to each. */
export const projectShots: Shot[] = [
  { name: 'Frame of the mentor platform', steps: visit(mentor) },
  {
    name: 'Project menu',
    steps: async (page) => {
      await openProjectMenu(page, mentor)
    },
  },
  {
    name: 'Project menu while the project loads',
    steps: async (page) => {
      await openProjectMenu(page, `${mentor}?mock-project=loading`)
    },
  },
  {
    name: 'Project menu when the project fails to load',
    steps: async (page) => {
      await openProjectMenu(page, `${mentor}?mock-project=error`)
    },
    ready: (page) => page.getByRole('menuitem', { name: 'Load the project again' }),
  },
  {
    name: 'Project menu while the projects load',
    steps: async (page) => {
      await openProjectMenu(page, `${mentor}?mock-projects=loading`)
    },
  },
  {
    name: 'Project menu when the projects fail to load',
    steps: async (page) => {
      await openProjectMenu(page, `${mentor}?mock-projects=error`)
    },
    ready: (page) => page.getByRole('menuitem', { name: /Failed to load projects/ }),
  },
  { name: 'Command palette', steps: openCommandPalette },
  {
    name: 'Command palette with a search',
    steps: async (page) => {
      await openCommandPalette(page)
      await page.keyboard.type('project')
    },
  },
  {
    name: 'Command palette while the projects load',
    steps: async (page) => {
      await openCommandPalette(page, `${mentor}?mock-projects=loading`)
    },
  },
  {
    name: 'Command palette when the projects fail to load',
    steps: async (page) => {
      await openCommandPalette(page, `${mentor}?mock-projects=error`)
    },
    ready: (page) => page.getByRole('option', { name: /Failed to load projects/ }),
  },
  {
    name: 'Notifications',
    steps: async (page) => {
      await page.goto(mentor)
      await page.getByRole('button', { name: 'Notifications' }).click()
      await expect(page.getByText('Nothing new.')).toBeVisible()
    },
  },
  { name: 'Project not found', steps: visit('/projects/missing/activity') },
  {
    name: 'Rename project from the project menu',
    steps: async (page) => {
      await openProjectMenu(page, mentor)
      await page.getByRole('menuitem', { name: 'Rename project' }).click()
    },
    ready: (page) => page.getByRole('dialog', { name: 'Rename project' }),
  },
  {
    name: 'Rename project in the command palette',
    steps: async (page) => {
      await openCommandPalette(page)
      await page.keyboard.type('rename')
    },
  },
]
