import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname, setSearch } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { UserSettingsPage } from '../UserSettingsPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  window.history.pushState({}, '', '/')
  setPathname('/settings')
  setSearch('')
})

const open = (section?: string) => {
  setSearch(section === undefined ? '' : `section=${section}`)
  render(<UserSettingsPage />, { wrapper: TestProviders })
}

describe('Profile', () => {
  it('shows the email, and saves a new name', async () => {
    open()
    const name = await screen.findByLabelText('Name')
    expect(screen.getByLabelText('Email')).toHaveValue('linh.pham@example.com')

    fireEvent.change(name, { target: { value: 'Linh P.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('asks for a name', async () => {
    open()
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
  })
})

describe('Password', () => {
  it('checks the new password before it sends it', async () => {
    open('password')
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'old-password' },
    })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
  })

  it('wants the new password typed twice', async () => {
    open('password')
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'old-password' },
    })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long-enough-1' } })
    fireEvent.change(screen.getByLabelText('New password again'), {
      target: { value: 'long-enough-2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('The two passwords differ.')).toBeInTheDocument()
  })

  it('changes the password, and clears the fields', async () => {
    open('password')
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'old-password' },
    })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long-enough-1' } })
    fireEvent.change(screen.getByLabelText('New password again'), {
      target: { value: 'long-enough-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toHaveValue('')
  })

  it('shows the problem that the server finds at its field', async () => {
    window.history.pushState({}, '', '/?mock-password=error')
    open('password')
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long-enough-1' } })
    fireEvent.change(screen.getByLabelText('New password again'), {
      target: { value: 'long-enough-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('The current password is wrong.')).toBeInTheDocument()
  })
})

describe('Preferences', () => {
  it('starts from the saved settings, with the run settings built from the workflow', async () => {
    open('preferences')

    expect(await screen.findByLabelText('Theme')).toHaveValue('dark')
    expect(screen.getByLabelText('A run waits for my review')).toBeChecked()
    expect(await screen.findByLabelText('Max turns')).toBeInTheDocument()
  })

  it('saves a change', async () => {
    open('preferences')
    fireEvent.change(await screen.findByLabelText('Output language of new projects'), {
      target: { value: 'vi' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })
})

describe('Models', () => {
  it('offers each role the models that can serve it, with the choices that were saved', async () => {
    open('models')

    const analyst = await screen.findByLabelText('Analyst')

    expect(analyst).toHaveValue('anthropic:claude-opus-5-5')
    expect(screen.getByLabelText('Planner')).toHaveValue('')
  })

  it('checks the temperature', async () => {
    open('models')
    fireEvent.change(await screen.findByLabelText('Temperature of Analyst'), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a number from 0 to 2.')).toBeInTheDocument()
  })

  it('saves the model of a role', async () => {
    open('models')
    fireEvent.change(await screen.findByLabelText('Planner'), {
      target: { value: 'anthropic:claude-sonnet-5-5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })
})

describe('Usage', () => {
  it('groups the usage by day, with a total', async () => {
    open('usage')

    const table = await screen.findByRole('table', { name: 'Usage' })

    expect(within(table).getAllByRole('row').length).toBeGreaterThan(7)
    expect(within(table).getByText('Total')).toBeInTheDocument()
  })

  it('groups it by another field', async () => {
    open('usage')
    await screen.findByRole('table', { name: 'Usage' })
    fireEvent.change(screen.getByLabelText('Group by'), { target: { value: 'project' } })

    await waitFor(() => {
      expect(screen.getByText('Mentor platform')).toBeInTheDocument()
    })
  })

  it('says that there is no usage', async () => {
    window.history.pushState({}, '', '/?mock-usage=empty')
    open('usage')

    expect(await screen.findByText('No usage yet')).toBeInTheDocument()
  })
})

describe('Login sessions', () => {
  it('lists the sessions, and signs out another one', async () => {
    open('sessions')

    const list = await screen.findByRole('list', { name: 'Login sessions' })
    expect(within(list).getByText('This device')).toBeInTheDocument()
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)

    fireEvent.click(within(list).getByRole('button', { name: 'Sign out Safari 19 on iPhone' }))

    await waitFor(() => {
      expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    })
  })
})
