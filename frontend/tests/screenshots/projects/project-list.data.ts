import { expect, type Page } from '@playwright/test'

import { type Shot, visit } from '../screenshot.utils'

const prompt = 'What product do you want to write the requirements for?'

async function typeIdea(page: Page, address = '/projects') {
  await page.goto(address)
  await page
    .getByRole('textbox', { name: prompt })
    .fill('Thesis tracker\nFor the supervisors of a faculty.')
}

async function openCreateProjectDialog(page: Page, address?: string) {
  await typeIdea(page, address)
  await page.getByRole('main').getByRole('button', { name: 'Create project' }).click()
  await expect(page.getByRole('dialog', { name: 'Create project' })).toBeVisible()
}

/** The steps that create a project from the dialog, opened from `address`. */
function createProject(address?: string): Shot['steps'] {
  return async (page) => {
    await openCreateProjectDialog(page, address)
    await page.getByRole('dialog').getByRole('button', { name: 'Create project' }).click()
  }
}

const formError = (page: Page) => page.getByRole('dialog').getByRole('alert')

const table = (page: Page) => page.getByRole('table')

async function openFilters(page: Page) {
  await page.goto('/projects')
  await page.getByRole('button', { name: /^Filter/ }).click()
  await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
}

/** The steps that apply one value of the filters. */
function applyFilter(value: string): Shot['steps'] {
  return async (page) => {
    await openFilters(page)
    await page.getByRole('dialog').getByRole('button', { name: value }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click()
  }
}

// A project whose runs ended, which can be deleted, and one archived.
const campus = 'Campus food ordering'
const laundry = 'Dorm laundry booking'

/** Opens the menu of `project`, in the archived list for an archived project. */
async function openProjectMenu(page: Page, project = 'Mentor platform', address = '/projects') {
  await page.goto(address)
  if (project === laundry) await page.getByRole('button', { name: 'Archived' }).click()
  await page.getByRole('button', { name: `Actions for ${project}` }).click()
  await expect(page.getByRole('menu')).toBeVisible()
}

/** The steps that choose an item of the menu of `project`, opened from `address`. */
function chooseInMenu(item: string, project?: string, address?: string): Shot['steps'] {
  return async (page) => {
    await openProjectMenu(page, project, address)
    await page.getByRole('menuitem', { name: item }).click()
  }
}

/** The steps that rename the mentor platform from its dialog, opened from `address`. */
function renameProject(address?: string): Shot['steps'] {
  return async (page) => {
    await chooseInMenu('Rename', undefined, address)(page)
    await page.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('Mentor finder')
    await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()
  }
}

/** The steps that delete a project whose runs ended from its dialog, opened from `address`. */
function deleteProject(address?: string): Shot['steps'] {
  return async (page) => {
    await chooseInMenu('Delete', campus, address)(page)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete project' }).click()
  }
}

/**
 * The states of the project list, of the dialog that creates a project and of the menu of a
 * project, and the steps to each.
 */
export const projectListShots: Shot[] = [
  { name: 'Projects', steps: visit('/projects') },
  { name: 'Loading', steps: visit('/projects?mock-projects=loading') },
  {
    name: 'Error',
    steps: visit('/projects?mock-projects=error'),
    ready: (page) => page.getByRole('heading', { name: 'Something went wrong' }),
  },
  { name: 'No project yet', steps: visit('/projects?mock-projects=empty') },
  {
    name: 'Prompt with the focus',
    steps: async (page) => {
      await page.goto('/projects')
      await page.getByRole('textbox', { name: prompt }).click()
    },
  },
  { name: 'Prompt with an idea', steps: typeIdea },
  { name: 'Create project dialog', steps: openCreateProjectDialog },
  {
    name: 'Create project dialog with the agent settings open',
    steps: async (page) => {
      await openCreateProjectDialog(page)
      await page.getByRole('button', { name: 'Agent settings' }).click()
    },
  },
  {
    name: 'Create project dialog with an idea left empty',
    steps: async (page) => {
      await openCreateProjectDialog(page)
      await page.getByRole('dialog').getByLabel('Idea').clear()
      await page.getByRole('dialog').getByRole('button', { name: 'Create project' }).click()
    },
    ready: formError,
  },
  {
    name: 'Creating the project',
    steps: createProject('/projects?mock-create-project=loading'),
    ready: (page) => page.getByLabel('Creating the project'),
  },
  {
    name: 'The project fails to be created',
    steps: createProject('/projects?mock-create-project=error'),
    ready: formError,
  },
  {
    name: 'A field that the API does not take',
    steps: createProject('/projects?mock-create-project=invalid'),
    ready: formError,
  },
  {
    name: 'The project is created, but its idea is not sent',
    steps: async (page) => {
      await createProject('/projects?mock-send-message=error')(page)
      await expect(page).toHaveURL(/\/activity$/)
    },
    ready: (page) => page.getByText('The project is created, but its idea was not sent.'),
  },
  {
    name: 'A project under the pointer',
    steps: visit('/projects'),
    hover: (page) => page.getByRole('row', { name: /Mentor platform/ }),
  },
  {
    name: 'Archived projects',
    steps: async (page) => {
      await page.goto('/projects')
      await page.getByRole('button', { name: 'Archived' }).click()
    },
  },
  {
    name: 'No archived project',
    steps: async (page) => {
      await page.goto('/projects?mock-projects=empty')
      await page.getByRole('button', { name: 'Archived' }).click()
    },
    ready: (page) => page.getByText('No archived projects.'),
  },
  { name: 'Filters of the list', steps: openFilters },
  {
    name: 'Filters with values chosen, one under the pointer and one with the focus',
    steps: async (page) => {
      await openFilters(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Waiting for you' }).click()
      await dialog.getByRole('button', { name: 'In the last 7 days' }).click()
      // The keyboard moves the focus to the next value, which shows its ring.
      await page.keyboard.press('Tab')
    },
    part: (page) => page.getByRole('dialog'),
    hover: (page) => page.getByRole('dialog').getByRole('button', { name: 'Working' }),
  },
  {
    name: 'The projects that wait for the user',
    steps: applyFilter('Waiting for you'),
    ready: (page) => page.getByRole('button', { name: /^Filter\W+1 applied$/ }),
  },
  {
    name: 'No project matches the filters',
    steps: applyFilter('In the last day'),
    ready: (page) => page.getByRole('heading', { name: 'No projects match the filters' }),
  },
  {
    name: 'Filters given in the address',
    steps: visit('/projects?run-status=failed&run-status=none'),
    ready: (page) => page.getByRole('button', { name: /^Filter\W+1 applied$/ }),
  },
  {
    name: 'The end of a long list, with Show more projects',
    steps: async (page) => {
      await page.goto('/projects?mock-projects=many')
      await page.getByRole('button', { name: 'Show more projects' }).scrollIntoViewIfNeeded()
    },
  },
  {
    name: 'Loading more projects',
    steps: async (page) => {
      await page.goto('/projects?mock-projects=more-loading')
      await page.getByRole('button', { name: 'Show more projects' }).click()
    },
    ready: (page) => page.getByLabel('Loading more projects'),
  },
  {
    name: 'The mentor platform running',
    steps: visit('/projects?mock-run-state=running'),
    part: table,
  },
  {
    name: 'No unfinished run in the mentor platform',
    steps: visit('/projects?mock-run-state=done'),
    part: table,
  },
  {
    name: 'A project created without a name',
    steps: async (page) => {
      await openCreateProjectDialog(page)
      await page.getByRole('dialog').getByRole('button', { name: 'Create project' }).click()
      await expect(page).toHaveURL(/\/activity$/)
    },
  },
  {
    name: 'Menu of a project, with Delete under the pointer',
    steps: (page) => openProjectMenu(page),
    hover: (page) => page.getByRole('menuitem', { name: 'Delete' }),
  },
  {
    name: 'Rename project dialog',
    steps: chooseInMenu('Rename'),
    ready: (page) => page.getByRole('dialog', { name: 'Rename project' }),
  },
  {
    name: 'A project renamed',
    steps: renameProject(),
    ready: (page) => page.getByText('Project renamed'),
  },
  {
    name: 'Renaming the project',
    steps: renameProject('/projects?mock-update-project=loading'),
    ready: (page) => page.getByLabel('Renaming the project'),
  },
  {
    name: 'The project fails to be renamed',
    steps: renameProject('/projects?mock-update-project=error'),
    ready: formError,
  },
  {
    name: 'A project archived, with Undo in the toast',
    steps: chooseInMenu('Archive'),
    ready: (page) => page.getByText('Project archived'),
  },
  {
    name: 'The project fails to be archived',
    steps: chooseInMenu('Archive', undefined, '/projects?mock-update-project=error'),
    ready: (page) => page.getByText(/^Failed to archive the project/),
  },
  { name: 'Menu of an archived project', steps: (page) => openProjectMenu(page, laundry) },
  {
    name: 'A project restored',
    steps: chooseInMenu('Restore', laundry),
    ready: (page) => page.getByText('Project restored'),
  },
  {
    name: 'The project fails to be restored',
    steps: chooseInMenu('Restore', laundry, '/projects?mock-update-project=error'),
    ready: (page) => page.getByText(/^Failed to restore the project/),
  },
  {
    name: 'Delete project dialog',
    steps: chooseInMenu('Delete', campus),
    ready: (page) => page.getByRole('alertdialog', { name: 'Delete project?' }),
  },
  { name: 'Deleting the project', steps: deleteProject('/projects?mock-delete-project=loading') },
  {
    name: 'The project fails to be deleted',
    steps: deleteProject('/projects?mock-delete-project=error'),
    ready: (page) => page.getByText(/^Failed to delete the project/),
  },
  {
    name: 'A project with a run that is not finished, which is not deleted',
    steps: chooseInMenu('Delete'),
    ready: (page) => page.getByRole('alertdialog', { name: 'Stop the run first' }),
  },
]
