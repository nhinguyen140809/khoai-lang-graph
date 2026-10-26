import { test } from '../../shared/fixtures.utils'
import { createdProjectCases, listCases, notFoundCases, openedProjectCases } from './projects.data'

const prompt = 'What product do you want to write the requirements for?'

for (const { name, from, status, id } of openedProjectCases) {
  test(`opens ${name} from the list at its activity`, async ({ page, user }) => {
    await page.goto(from)

    await user.expectUrl(/\/projects$/)
    const row = page.getByRole('row', { name: new RegExp(name) })
    await user.expectRole('cell', status, row)
    await user.pressLink(name)

    await user.expectUrl(new RegExp(`/projects/${id}/activity$`))
    await user.expectRole('button', name, page.getByRole('banner'))
  })
}

for (const { name, idea, typedName, shownName } of createdProjectCases) {
  test(`${name}, and opens its activity`, async ({ page, user }) => {
    await page.goto('/projects')

    await user.fillTextbox(prompt, idea)
    await user.pressButton('Create project', page.getByRole('main'))
    const dialog = page.getByRole('dialog', { name: 'Create project' })
    await user.expectFieldValue('Idea', idea, dialog)
    await user.fillTextbox('Name (optional)', typedName, dialog)
    await user.pressButton('Create project', dialog)

    await user.expectUrl(/\/projects\/[^/]+\/activity$/)
    await user.expectRole('button', shownName, page.getByRole('banner'))
  })
}

for (const { name, archived, shows, hides } of listCases) {
  test(name, async ({ page, user }) => {
    await page.goto('/projects')

    if (archived) await user.pressButton('Archived')

    await user.expectRole('link', shows)
    await user.expectNoRole('link', hides)
  })
}

for (const { name, address } of notFoundCases) {
  test(`shows ${name} as not found`, async ({ page, user }) => {
    await page.goto(address)

    await user.expectRole('heading', 'Project not found')
    await user.pressLink('All projects')
    await user.expectUrl(/\/projects$/)
  })
}
