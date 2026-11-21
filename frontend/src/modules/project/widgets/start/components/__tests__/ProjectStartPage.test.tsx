import { screen, within } from '@testing-library/react'
import { describe, it } from 'vitest'

import { createdId, IdPrefix } from '@/mocks/shared/db'
import { DeskProjectPagesProvider } from '@/modules/project/entities'
import { renderWithProviders } from '@/test/render'
import { expectNoRole, expectPushedTo, pasteText, press, pressKey, pressRole } from '@/test/steps'

import { ProjectStartPage } from '../ProjectStartPage'

function renderPage() {
  return renderWithProviders(
    <DeskProjectPagesProvider>
      <ProjectStartPage />
    </DeskProjectPagesProvider>,
  )
}

/** Types an idea in the prompt and sends it, which opens the new project dialog. */
async function startProject(idea: string) {
  await pressRole('textbox', 'What do you want to build?')
  await pasteText(idea)
  await pressKey('Enter')
  return screen.findByRole('dialog', { name: 'Create project' })
}

describe('ProjectStartPage', () => {
  it('creates a project from the idea of the prompt and opens its chat', async () => {
    renderPage()

    const dialog = await startProject('Mentor platform for students.')
    await press(within(dialog).getByRole('button', { name: 'Create project' }))

    await expectPushedTo(`/projects/${createdId(IdPrefix.Project, 1)}`)
  })

  it('does not open the dialog again when the page shows again', async () => {
    const page = renderPage()
    await startProject('Mentor platform')

    page.unmount()
    renderPage()

    expectNoRole('dialog')
  })
})
