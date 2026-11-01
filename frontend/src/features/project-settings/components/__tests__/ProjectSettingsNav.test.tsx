import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
import { setPathname, setSearch } from '@/test/next-mocks.utils'

import { ProjectSettingsNav } from '../ProjectSettingsNav'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

const settingsPath = `/projects/${PROJECT_IDS.mentor}/settings`

beforeEach(() => {
  setPathname(settingsPath)
  setSearch('')
})

describe('ProjectSettingsNav', () => {
  it('links to the sections, and marks the one that is open', () => {
    setSearch('section=runs')
    render(<ProjectSettingsNav projectId={PROJECT_IDS.mentor} />)

    expect(screen.getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute('href', settingsPath)
    expect(screen.getByRole('link', { name: 'Models' })).toHaveAttribute(
      'href',
      `${settingsPath}?section=models`,
    )
  })

  it('marks no section while another page of the project is on screen', () => {
    setPathname(`/projects/${PROJECT_IDS.mentor}/console`)
    render(<ProjectSettingsNav projectId={PROJECT_IDS.mentor} />)

    expect(screen.getByRole('link', { name: 'General' })).not.toHaveAttribute('aria-current')
  })
})
