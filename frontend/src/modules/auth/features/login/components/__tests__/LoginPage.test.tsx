import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { routerMock } from '@/test/next-stubs/next-stubs.utils'
import { TestProviders } from '@/test/render/TestProviders'

import { LoginPage } from '../LoginPage'
import { missingFieldCases, refusedSignInCases, returnCases } from './LoginPage.data'

vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-stubs/next-stubs.utils')).navigationMock,
)
vi.mock('next/link', async () => (await import('@/test/next-stubs/next-stubs.utils')).linkMock)

beforeEach(() => {
  routerMock.replace.mockClear()
})

async function signIn(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  it.each(returnCases)('signs in and opens $opens for $next', async ({ next, opens }) => {
    render(<LoginPage next={next} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith(opens)
    })
  })

  it.each(refusedSignInCases)('says $name, and stays', async ({ answer, alert }) => {
    server.use(http.post('/api/v1/auth/login', answer))
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect(await screen.findByRole('alert')).toHaveTextContent(alert)
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it.each(missingFieldCases)('asks for $name before sending', async ({ typed, messages }) => {
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    for (const [label, value] of Object.entries(typed)) {
      await userEvent.type(screen.getByLabelText(label), value)
    }
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    for (const message of messages) expect(await screen.findByText(message)).toBeInTheDocument()
  })

  it('links to the account page, keeping the page to return to', () => {
    render(<LoginPage next="/projects/p1/console" />, { wrapper: TestProviders })

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register?next=%2Fprojects%2Fp1%2Fconsole',
    )
  })

  it('has the place of the link that resets a password, not available yet', () => {
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    expect(screen.getByRole('button', { name: 'Forgot password?' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('shows a failure of the network', async () => {
    server.use(http.post('/api/v1/auth/login', () => HttpResponse.error()))
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect((await screen.findByRole('alert')).textContent).not.toBe('')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('sends the email without the spaces around it', async () => {
    let sent: unknown = null
    server.use(
      http.post('/api/v1/auth/login', async ({ request }) => {
        sent = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('  linh.pham@example.com  ', 'secret')

    await vi.waitFor(() => {
      expect(sent).toEqual({ email: 'linh.pham@example.com', password: 'secret' })
    })
  })

  it('disables the button while signing in', async () => {
    let answer: (() => void) | undefined
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    server.use(
      http.post('/api/v1/auth/login', async () => {
        await answered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect(await screen.findByLabelText('Signing in')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeDisabled()
    answer?.()
    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/')
    })
  })
})
