import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiEndpoints } from '@/shared/api/endpoints'
import { setPathname, setQuery } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectDisabled,
  expectFieldValue,
  expectNoRole,
  expectReplacedWith,
  expectRole,
  pasteText,
  pressButton,
  pressEscape,
  pressKey,
} from '@/test/steps'

import { ProjectListPage } from '../ProjectListPage'

function renderPage() {
  return renderWithProviders(<ProjectListPage />)
}

/** Types an idea in the prompt and sends it, which opens the new project dialog. */
async function startProject(idea: string) {
  await userEvent.click(
    screen.getByRole('textbox', {
      name: 'What product do you want to write the requirements for?',
    }),
  )
  await pasteText(idea)
  await pressKey('Enter')
  return screen.findByRole('dialog', { name: 'Create project' })
}

describe('ProjectListPage', () => {
  it('lists the projects of the filters in the address', async () => {
    setQuery('run-status=interrupted')
    renderPage()

    await expectRole('link', 'Mentor platform')
    expectNoRole('link', 'Library booking')
    await expectRole('button', /^Filter\W+1 applied$/)
  })

  it('puts the filters applied in the address', async () => {
    setPathname('/projects')
    renderPage()

    await pressButton('Filter')
    await pressButton('Waiting for you')
    await pressButton('In the last 7 days')
    await pressButton('Apply')

    await expectReplacedWith('/projects?run-status=interrupted&last-activity=7', { scroll: false })
  })

  it('opens the new project dialog on the idea sent from the prompt', async () => {
    renderPage()

    const dialog = await startProject('Mentor platform\nFor university students.')

    expect(within(dialog).getByRole('textbox', { name: 'Idea' })).toHaveValue(
      'Mentor platform\nFor university students.',
    )
    expectFieldValue('Name (optional)', '', within(dialog))
  })

  it('does not open the dialog again when the page shows again', async () => {
    const page = renderPage()
    await startProject('Mentor platform')

    page.unmount()
    renderPage()

    expectNoRole('dialog')
  })

  it('stays open while the project is created', async () => {
    server.use(http.post(apiEndpoints.projects.pattern, () => delay('infinite')))
    renderPage()
    const dialog = await startProject('Mentor platform')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Create project' }))
    await pressEscape()

    await expectRole('dialog', 'Create project')
    expectDisabled('button', 'Cancel', within(dialog))
  })
})
