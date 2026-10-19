import { expect, type Page } from '@playwright/test'

import { IdPrefix, mockId, PROJECT_IDS } from '../../../src/mocks/shared/mock-ids.constants'
import { type Shot, visit } from '../screenshot.utils'

const mentor = `/projects/${PROJECT_IDS.mentor}/activity`

function activityOf(projectNumber: number) {
  return `/projects/${mockId(IdPrefix.Project, projectNumber)}/activity`
}

async function openProjectMenu(page: Page, address: string) {
  await page.goto(address)
  await page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('button').click()
  await expect(page.getByRole('menu')).toBeVisible()
}

/** The steps that press Stop beside the status of the mentor platform, opened at `address`. */
function pressStop(address = mentor): Shot['steps'] {
  return async (page) => {
    await page.goto(address)
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    await expect(page.getByRole('alertdialog', { name: 'Stop the run?' })).toBeVisible()
  }
}

/** The steps that stop the run of the mentor platform from its dialog, opened at `address`. */
function stopRun(address?: string): Shot['steps'] {
  return async (page) => {
    await pressStop(address)(page)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Stop run' }).click()
  }
}

async function openCommandPalette(page: Page, address = mentor) {
  await page.goto(address)
  await page.getByRole('button', { name: 'Search or run a command' }).click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
}

// The states of the status of a project differ in the status bar only.
function status(name: string, address: string, ready?: Shot['ready']): Shot {
  return {
    name: `Status: ${name}`,
    steps: visit(address),
    part: (page) => page.getByRole('contentinfo'),
    ...(ready === undefined ? {} : { ready }),
  }
}

/** The states of the frame of a project, its menus and its status, and the steps to each. */
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
  status('waiting for you', mentor),
  status('starting', `${mentor}?mock-run-state=queued`),
  status('working', `${mentor}?mock-run-state=running`),
  status('failed', `${mentor}?mock-run-state=failed`),
  {
    name: 'Status: why the run failed',
    steps: async (page) => {
      await page.goto(`${mentor}?mock-run-state=failed`)
      // The focus opens the tooltip, and keeps it open while the pointer moves away.
      await page.getByRole('contentinfo').getByRole('link').focus()
    },
    ready: (page) => page.getByRole('tooltip'),
  },
  status('done', `/projects/${PROJECT_IDS.campus}/activity`),
  status('monthly budget near its limit', `${mentor}?mock-budget=warning`),
  status('monthly budget nearly spent', `${mentor}?mock-budget=danger`),
  status('stopped', activityOf(10)),
  status('not started', activityOf(12)),
  status('loading', `${mentor}?mock-threads=loading`),
  status('error', `${mentor}?mock-threads=error`, (page) =>
    page.getByText('Failed to load the status.'),
  ),
  status('without the label of a stage', `${mentor}?mock-workflow=error`),
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
  { name: 'Stop run dialog', steps: pressStop() },
  { name: 'Stopping the run', steps: stopRun(`${mentor}?mock-cancel-run=loading`) },
  {
    name: 'The run fails to stop',
    steps: stopRun(`${mentor}?mock-cancel-run=error`),
    ready: (page) => page.getByText(/^Failed to stop the run/),
  },
  {
    name: 'Run stopped',
    steps: stopRun(),
    ready: (page) => page.getByText('Run stopped'),
  },
  {
    name: 'Stop run in the command palette',
    steps: async (page) => {
      await openCommandPalette(page)
      await page.keyboard.type('stop')
    },
  },
]
