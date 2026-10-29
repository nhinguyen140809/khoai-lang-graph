import type { Page } from '@playwright/test'

import type { UserSteps } from '../../shared/steps'
import { screenshots } from '../screenshot.utils'

const projects = '/projects'
const prompt = 'What product do you want to write the requirements for?'

// A project whose runs ended, which can be deleted, and one archived.
const campus = 'Campus food ordering'
const laundry = 'Dorm laundry booking'

async function typeIdea(page: Page) {
  await page
    .getByRole('textbox', { name: prompt })
    .fill('Thesis tracker\nFor the supervisors of a faculty.')
}

async function openCreateProjectDialog(page: Page, user: UserSteps) {
  await typeIdea(page)
  await user.pressButton('Create project', page.getByRole('main'))
  await user.expectRole('dialog', 'Create project')
}

async function createProject(page: Page, user: UserSteps) {
  await openCreateProjectDialog(page, user)
  await user.pressDialogButton('Create project')
}

/** The error of the form in the dialog that is open. */
async function expectFormError(page: Page, user: UserSteps) {
  await user.expectRole('alert', undefined, page.getByRole('dialog'))
}

async function openFilters(page: Page, user: UserSteps) {
  await page.getByRole('button', { name: /^Filter/ }).click()
  await user.expectRole('dialog', 'Filters')
}

async function applyFilter(page: Page, user: UserSteps, value: string) {
  await openFilters(page, user)
  await page.getByRole('dialog').getByRole('button', { name: value }).click()
  await user.pressDialogButton('Apply')
}

/** Opens the menu of `project`, in the archived list for an archived project. */
async function openProjectMenu(page: Page, user: UserSteps, project = 'Mentor platform') {
  if (project === laundry) await user.pressButton('Archived')
  await page.getByRole('button', { name: `Actions for ${project}` }).click()
  await user.expectRole('menu')
}

/** Chooses an item of the menu of `project`. */
async function chooseInMenu(page: Page, user: UserSteps, item: string, project?: string) {
  await openProjectMenu(page, user, project)
  await user.pressMenuItem(item)
}

/** Renames the mentor platform from its dialog. */
async function renameProject(page: Page, user: UserSteps) {
  await chooseInMenu(page, user, 'Rename')
  await user.fillTextbox('Name', 'Mentor finder', page.getByRole('dialog'))
  await user.pressDialogButton('Rename')
}

/** Deletes a project whose runs ended from its dialog. */
async function deleteProject(page: Page, user: UserSteps) {
  await chooseInMenu(page, user, 'Delete', campus)
  await user.pressAlertDialogButton('Delete project')
}

screenshots('Project list', (shot) => {
  shot.at('Projects', projects)

  shot.at('Loading', `${projects}?mock-projects=loading`)

  shot('Error', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-projects=error`)

    await user.expectRole('heading', 'Something went wrong')
    await shoot()
  })

  shot.at('No project yet', `${projects}?mock-projects=empty`)

  shot('Prompt with the focus', async ({ page, shoot }) => {
    await page.goto(projects)

    await page.getByRole('textbox', { name: prompt }).click()
    await shoot()
  })

  shot('Prompt with an idea', async ({ page, shoot }) => {
    await page.goto(projects)

    await typeIdea(page)
    await shoot()
  })

  shot('Create project dialog', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openCreateProjectDialog(page, user)
    await shoot()
  })

  shot('Create project dialog with the agent settings open', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openCreateProjectDialog(page, user)
    await user.pressButton('Agent settings')
    await shoot()
  })

  shot('Create project dialog with an idea left empty', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openCreateProjectDialog(page, user)
    await page.getByRole('dialog').getByLabel('Idea').clear()
    await user.pressDialogButton('Create project')
    await expectFormError(page, user)
    await shoot()
  })

  shot('Creating the project', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-create-project=loading`)

    await createProject(page, user)
    await user.expectLabel('Creating the project')
    await shoot()
  })

  shot('The project fails to be created', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-create-project=error`)

    await createProject(page, user)
    await expectFormError(page, user)
    await shoot()
  })

  shot('A field that the API does not take', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-create-project=invalid`)

    await createProject(page, user)
    await expectFormError(page, user)
    await shoot()
  })

  shot('The project is created, but its idea is not sent', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-send-message=error`)

    await createProject(page, user)
    await user.expectUrl(/\/activity$/)
    await user.expectText('The project is created, but its idea was not sent.')
    await shoot()
  })

  shot('A project under the pointer', async ({ page, shoot }) => {
    await page.goto(projects)

    await shoot({ hover: page.getByRole('row', { name: /Mentor platform/ }) })
  })

  shot('Archived projects', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await user.pressButton('Archived')
    await shoot()
  })

  shot('No archived project', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-projects=empty`)

    await user.pressButton('Archived')
    await user.expectText('No archived projects.')
    await shoot()
  })

  shot('Filters of the list', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openFilters(page, user)
    await shoot()
  })

  shot(
    'Filters with values chosen, one under the pointer and one with the focus',
    async ({ page, user, shoot }) => {
      await page.goto(projects)

      await openFilters(page, user)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Waiting for you' }).click()
      await dialog.getByRole('button', { name: 'In the last 7 days' }).click()
      // The keyboard moves the focus to the next value, which shows its ring.
      await user.pressKey('Tab')
      await shoot({ part: dialog, hover: dialog.getByRole('button', { name: 'Working' }) })
    },
  )

  shot('The projects that wait for the user', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await applyFilter(page, user, 'Waiting for you')
    await user.expectRole('button', /^Filter\W+1 applied$/)
    await shoot()
  })

  shot('No project matches the filters', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await applyFilter(page, user, 'In the last day')
    await user.expectRole('heading', 'No projects match the filters')
    await shoot()
  })

  shot('Filters given in the address', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?run-status=failed&run-status=none`)

    await user.expectRole('button', /^Filter\W+1 applied$/)
    await shoot()
  })

  shot('The end of a long list, with Show more projects', async ({ page, shoot }) => {
    await page.goto(`${projects}?mock-projects=many`)

    await page.getByRole('button', { name: 'Show more projects' }).scrollIntoViewIfNeeded()
    await shoot()
  })

  shot('Loading more projects', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-projects=more-loading`)

    await user.pressButton('Show more projects')
    await user.expectLabel('Loading more projects')
    await shoot()
  })

  shot('The mentor platform running', async ({ page, shoot }) => {
    await page.goto(`${projects}?mock-run-status=running`)

    await shoot({ part: page.getByRole('table') })
  })

  shot('No unfinished run in the mentor platform', async ({ page, shoot }) => {
    await page.goto(`${projects}?mock-run-status=done`)

    await shoot({ part: page.getByRole('table') })
  })

  shot('A project created without a name', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openCreateProjectDialog(page, user)
    await user.pressDialogButton('Create project')
    await user.expectUrl(/\/activity$/)
    await shoot()
  })

  shot('Menu of a project, with Delete under the pointer', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openProjectMenu(page, user)
    await shoot({ hover: page.getByRole('menuitem', { name: 'Delete' }) })
  })

  shot('Rename project dialog', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await chooseInMenu(page, user, 'Rename')
    await user.expectRole('dialog', 'Rename project')
    await shoot()
  })

  shot('A project renamed', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await renameProject(page, user)
    await user.expectText('Project renamed')
    await shoot()
  })

  shot('Renaming the project', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-update-project=loading`)

    await renameProject(page, user)
    await user.expectLabel('Renaming the project')
    await shoot()
  })

  shot('The project fails to be renamed', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-update-project=error`)

    await renameProject(page, user)
    await expectFormError(page, user)
    await shoot()
  })

  shot('A project archived, with Undo in the toast', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await chooseInMenu(page, user, 'Archive')
    await user.expectText('Project archived')
    await shoot()
  })

  shot('The project fails to be archived', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-update-project=error`)

    await chooseInMenu(page, user, 'Archive')
    await user.expectText(/^Failed to archive the project/)
    await shoot()
  })

  shot('Menu of an archived project', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await openProjectMenu(page, user, laundry)
    await shoot()
  })

  shot('A project restored', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await chooseInMenu(page, user, 'Restore', laundry)
    await user.expectText('Project restored')
    await shoot()
  })

  shot('The project fails to be restored', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-update-project=error`)

    await chooseInMenu(page, user, 'Restore', laundry)
    await user.expectText(/^Failed to restore the project/)
    await shoot()
  })

  shot('Delete project dialog', async ({ page, user, shoot }) => {
    await page.goto(projects)

    await chooseInMenu(page, user, 'Delete', campus)
    await user.expectRole('alertdialog', 'Delete project?')
    await shoot()
  })

  shot('Deleting the project', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-delete-project=loading`)

    await deleteProject(page, user)
    await shoot()
  })

  shot('The project fails to be deleted', async ({ page, user, shoot }) => {
    await page.goto(`${projects}?mock-delete-project=error`)

    await deleteProject(page, user)
    await user.expectText(/^Failed to delete the project/)
    await shoot()
  })

  shot(
    'A project with a run that is not finished, which is not deleted',
    async ({ page, user, shoot }) => {
      await page.goto(projects)

      await chooseInMenu(page, user, 'Delete')
      await user.expectRole('alertdialog', 'Stop the run first')
      await shoot()
    },
  )
})
