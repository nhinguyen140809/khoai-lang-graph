import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiEndpoints } from '@/shared/api/endpoints'
import { routerMock, setPathname, setSearch } from '@/test/next-stubs/next-stubs.utils'
import { TestProviders } from '@/test/render/TestProviders'

import { ProjectListPage } from '../ProjectListPage'

vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-stubs/next-stubs.utils')).navigationMock,
)
vi.mock('next/link', async () => (await import('@/test/next-stubs/next-stubs.utils')).linkMock)

function renderPage() {
  return render(<ProjectListPage />, { wrapper: TestProviders })
}

/** Types an idea in the prompt and sends it, which opens the new project dialog. */
async function startProject(idea: string) {
  await userEvent.click(
    screen.getByRole('textbox', {
      name: 'What product do you want to write the requirements for?',
    }),
  )
  await userEvent.paste(idea)
  await userEvent.keyboard('{Enter}')
  return screen.findByRole('dialog', { name: 'Create project' })
}

afterEach(() => {
  setPathname('/')
  setSearch('')
  routerMock.replace.mockClear()
})

describe('ProjectListPage', () => {
  it('lists the projects of the filters in the address', async () => {
    setSearch('run-status=interrupted')
    renderPage()

    expect(await screen.findByRole('link', { name: 'Mentor platform' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Library booking' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filter\W+1 applied$/ })).toBeInTheDocument()
  })

  it('puts the filters applied in the address', async () => {
    setPathname('/projects')
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Filter' }))
    await userEvent.click(screen.getByRole('button', { name: 'Waiting for you' }))
    await userEvent.click(screen.getByRole('button', { name: 'In the last 7 days' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(routerMock.replace).toHaveBeenCalledWith(
      '/projects?run-status=interrupted&last-activity=7',
      { scroll: false },
    )
  })

  it('opens the new project dialog on the idea sent from the prompt', async () => {
    renderPage()

    const dialog = await startProject('Mentor platform\nFor university students.')

    expect(within(dialog).getByRole('textbox', { name: 'Idea' })).toHaveValue(
      'Mentor platform\nFor university students.',
    )
    expect(within(dialog).getByRole('textbox', { name: 'Name (optional)' })).toHaveValue('')
  })

  it('does not open the dialog again when the page shows again', async () => {
    const page = renderPage()
    await startProject('Mentor platform')

    page.unmount()
    renderPage()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays open while the project is created', async () => {
    server.use(http.post(apiEndpoints.projects.pattern, () => delay('infinite')))
    renderPage()
    const dialog = await startProject('Mentor platform')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Create project' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('dialog', { name: 'Create project' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
