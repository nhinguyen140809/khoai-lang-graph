import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS, RUN_IDS } from '@/mocks/mock-ids.constants'
import { setPathname, setSearch } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { RunTree } from '../RunTree'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/')
  setSearch('')
})

describe('RunTree', () => {
  it('lists the runs of the project, newest first, each with its state', async () => {
    render(<RunTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const list = await screen.findByRole('list', { name: 'Runs' })
    const links = within(list)
      .getAllByRole('link')
      .map((link) => link.textContent)

    expect(links[0]).toContain('Run 3')
    expect(links.at(-1)).toContain('Run 1')
    expect(links.join(' ')).toContain('failed')
  })

  it('opens a run into its steps, which link to the step in the run', async () => {
    render(<RunTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(await screen.findByRole('button', { name: 'Open Run 1' }))

    const steps = await screen.findByRole('list', { name: 'Steps of Run 1' })
    const first = within(steps).getAllByRole('link')[0]

    expect(first?.getAttribute('href')).toMatch(
      new RegExp(`/projects/${PROJECT_IDS.mentor}/workflow/${RUN_IDS.mentorMain1}\\?step=`),
    )
  })

  it('folds the turns of an interview into one row that can be opened', async () => {
    render(<RunTree projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(await screen.findByRole('button', { name: 'Open Run 1' }))

    const steps = await screen.findByRole('list', { name: 'Steps of Run 1' })
    const group = within(steps)
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-expanded') === 'false')

    if (group === undefined) throw new Error('No group of steps')
    const before = within(steps).getAllByRole('link').length
    await userEvent.click(group)

    expect(within(steps).getAllByRole('link').length).toBeGreaterThan(before)
  })
})
