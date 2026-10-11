import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { server } from '@/mocks/msw-server.setup'
import { TestProviders } from '@/test/TestProviders'

import { useNewProjectDialogStore } from '../../new-project.store'
import { ProjectTable } from '../ProjectTable'

vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

describe('ProjectTable', () => {
  it('lists the active projects with the state of their runs', async () => {
    render(<ProjectTable status="active" />, { wrapper: TestProviders })

    const mentor = await screen.findByRole('link', { name: 'Mentor platform' })
    expect(mentor).toHaveAttribute('href', `/projects/${PROJECT_IDS.mentor}/session`)
    const mentorRow = mentor.closest('tr')
    if (mentorRow === null) throw new Error('The project has no row')

    expect(await within(mentorRow).findByText('Waiting for review')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Items' })).not.toBeInTheDocument()

    const library = screen.getByRole('link', { name: 'Library booking' }).closest('tr')
    if (library === null) throw new Error('The project has no row')
    expect(await within(library).findByText('Running')).toBeInTheDocument()

    expect(screen.queryByRole('link', { name: 'Dorm laundry booking' })).not.toBeInTheDocument()
  })

  it('lists the archived projects', async () => {
    render(<ProjectTable status="archived" />, { wrapper: TestProviders })

    expect(await screen.findByRole('link', { name: 'Dorm laundry booking' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mentor platform' })).not.toBeInTheDocument()
  })

  it('offers a new project when there is none', async () => {
    server.use(
      http.get('/api/v1/projects', () => HttpResponse.json({ items: [], next_cursor: null })),
    )
    render(<ProjectTable status="active" />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'New project' }))

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(useNewProjectDialogStore.getState().open).toBe(true)
  })

  it('shows the error with a retry when the projects fail to load', async () => {
    server.use(http.get('/api/v1/projects', () => new HttpResponse(null, { status: 500 })))
    render(<ProjectTable status="active" />, { wrapper: TestProviders })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Failed to load projects (HTTP 500)')
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
