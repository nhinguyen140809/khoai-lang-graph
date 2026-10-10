import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { routerMock } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { RegisterPage } from '../RegisterPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  routerMock.replace.mockClear()
})

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Name'), 'An Tran')
  await userEvent.type(screen.getByLabelText('Email'), 'an@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('RegisterPage', () => {
  it('creates the account, signs in with it, and opens the projects', async () => {
    const requests: string[] = []
    server.events.on('request:start', ({ request }) => {
      requests.push(`${request.method} ${new URL(request.url).pathname}`)
    })
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    await fillForm()

    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/projects')
    })
    expect(requests).toEqual(['POST /api/v1/auth/register', 'POST /api/v1/auth/login'])
    server.events.removeAllListeners()
  })

  it('shows a field problem of the API at its field', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        HttpResponse.json(
          {
            status: 422,
            code: 'validation_failed',
            errors: [{ field: 'email', message: 'An account with this email exists.' }],
          },
          { status: 422 },
        ),
      ),
    )
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    await fillForm()

    expect(await screen.findByText('An account with this email exists.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('checks the email before sending', async () => {
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    await userEvent.type(screen.getByLabelText('Email'), 'not an email')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter an email address.')).toBeInTheDocument()
  })
})
