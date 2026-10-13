import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { routerMock } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { NewProjectForm } from '../NewProjectForm'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

function renderForm(onCreated = vi.fn()) {
  render(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>New project</DialogTitle>
        <NewProjectForm defaultLanguage="vi" onCreated={onCreated} />
      </DialogContent>
    </Dialog>,
    { wrapper: TestProviders },
  )
  return onCreated
}

beforeEach(() => {
  routerMock.push.mockClear()
})

describe('NewProjectForm', () => {
  it('asks for a name', async () => {
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(await screen.findByText('Enter a name.')).toBeInTheDocument()
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('creates the project, then opens its console', async () => {
    let created: unknown
    server.use(
      http.post('/api/v1/projects', async ({ request }) => {
        created = await request.json()
        return HttpResponse.json(
          {
            id: 'p-new',
            owner_id: 'u1',
            name: 'Thesis tracker',
            description: null,
            status: 'active',
            output_language: 'vi',
            run_config: {
              review_checkpoints: null,
              max_steps: null,
              max_cost_usd: null,
              parameters: null,
            },
            initial_message_id: null,
            model_overrides: {},
            item_counts: {},
            unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
            last_activity_at: '2026-10-10T08:00:00Z',
            created_at: '2026-10-10T08:00:00Z',
            updated_at: '2026-10-10T08:00:00Z',
          },
          { status: 201 },
        )
      }),
    )
    const onCreated = renderForm()

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), '  Thesis tracker ')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))

    await vi.waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith('/projects/p-new/console')
    })
    expect(created).toEqual({ name: 'Thesis tracker', description: null, output_language: 'vi' })
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('shows a field problem of the API at its field', async () => {
    server.use(
      http.post('/api/v1/projects', () =>
        HttpResponse.json(
          {
            status: 422,
            code: 'validation_failed',
            detail: 'A field is not valid.',
            errors: [{ field: 'name', message: 'A project with this name exists.' }],
          },
          { status: 422 },
        ),
      ),
    )
    renderForm()

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Mentor platform')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(await screen.findByText('A project with this name exists.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true')
  })
})
