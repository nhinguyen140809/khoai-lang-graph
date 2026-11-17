import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { renderWithProviders } from '@/test/render'
import { expectNoRole, expectRole, pressButton, pressMenuItem, replaceText } from '@/test/steps'

import { ProjectHeading } from '../ProjectHeading'

function renderHeading(projectId: string) {
  // The menu opens the dialogs that the layout holds.
  renderWithProviders(
    <>
      <ProjectHeading projectId={projectId} />
      <ProjectDialogs />
    </>,
  )
}

describe('ProjectHeading', () => {
  it('opens the actions of the open project from its name, and no other project', async () => {
    renderHeading(projectIds.mentor)

    await pressButton('Mentor platform')

    const menu = screen.getByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Rename', 'Archive', 'Delete'])
    expectNoRole('menuitem', 'All projects')
  })

  it('renames the open project', async () => {
    renderHeading(projectIds.mentor)

    await pressButton('Mentor platform')
    await pressMenuItem('Rename')
    const dialog = await screen.findByRole('dialog', { name: 'Rename project' })
    await replaceText(within(dialog).getByRole('textbox', { name: 'Name' }), 'Mentor finder{Enter}')

    await expectRole('button', 'Mentor finder')
  })

  it('says that a project does not exist, and offers to load it again', async () => {
    renderHeading('missing')

    await pressButton('Project not found')

    expect(screen.getByRole('menuitem', { name: 'Load the project again' })).toBeInTheDocument()
  })
})
