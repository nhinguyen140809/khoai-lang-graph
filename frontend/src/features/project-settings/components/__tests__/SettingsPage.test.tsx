import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { setPathname, setSearch } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { SettingsNav } from '../SettingsNav'
import { SettingsPage } from '../SettingsPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  window.history.pushState({}, '', '/')
  setPathname('/')
  setSearch('')
})

const page = () =>
  render(<SettingsPage projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

describe('General', () => {
  it('shows the fields of the project and saves a change', async () => {
    page()
    const name = await screen.findByLabelText('Name')
    expect(name).toHaveValue('Mentor platform')

    fireEvent.change(name, { target: { value: 'Mentor hub' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(name).toHaveValue('Mentor hub')
  })

  it('asks for a name before it saves', async () => {
    page()
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a name.')).toBeInTheDocument()
  })

  it('archives the project and restores it', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Archive the project' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Restore the project' }))
    expect(await screen.findByRole('button', { name: 'Archive the project' })).toBeInTheDocument()
  })

  it('says that the project does not exist', async () => {
    render(<SettingsPage projectId="missing" />, { wrapper: TestProviders })

    expect(await screen.findByText('Project not found')).toBeInTheDocument()
  })
})

describe('Runs', () => {
  beforeEach(() => {
    setSearch('section=runs')
  })

  it('builds a field for each run parameter of the workflow, and the checkpoints to review at', async () => {
    page()

    expect(await screen.findByLabelText('Max turns')).toBeInTheDocument()
    expect(screen.getByLabelText('Target personas num')).toHaveAttribute('placeholder', 'Default 3')
    expect(screen.getByLabelText('checkpoint_analysis')).toBeDisabled()
  })

  it('checks the limits of a parameter before it saves', async () => {
    page()
    fireEvent.change(await screen.findByLabelText('Max turns'), { target: { value: '99' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter 20 or less.')).toBeInTheDocument()
  })

  it('shows the problem that the server finds at its field', async () => {
    page()
    fireEvent.change(await screen.findByLabelText('Max personas'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Target personas num'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Must not be lower than target_personas_num.'),
    ).toBeInTheDocument()
  })

  it('saves the checkpoints and the limits', async () => {
    page()
    fireEvent.click(await screen.findByLabelText('Use my default'))
    fireEvent.click(screen.getByLabelText('checkpoint_analysis'))
    fireEvent.change(screen.getByLabelText('Max steps'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })
  })
})

describe('Models', () => {
  beforeEach(() => {
    setSearch('section=models')
  })

  it('offers each role only the models that can serve it', async () => {
    page()

    const analyst = await screen.findByLabelText('Analyst')
    const options = Array.from(analyst.querySelectorAll('option')).map(
      (option) => option.textContent,
    )

    expect(options).toContain('Claude Opus 5.5')
    expect(options).not.toContain('Llama 3.3 70B (local)')
    expect(options[0]).toBe('Default of my settings')
  })

  it('saves the model of a role', async () => {
    page()
    fireEvent.change(await screen.findByLabelText('Analyst'), {
      target: { value: 'anthropic:claude-opus-5-5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })
})

describe('SettingsNav', () => {
  it('links to the sections, and marks the one that is open', () => {
    setSearch('section=runs')
    render(<SettingsNav projectId={PROJECT_IDS.mentor} />)

    expect(screen.getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/settings`,
    )
    expect(screen.getByRole('link', { name: 'Models' })).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/settings?section=models`,
    )
  })
})
