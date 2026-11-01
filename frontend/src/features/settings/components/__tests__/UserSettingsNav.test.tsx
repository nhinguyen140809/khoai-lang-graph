import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname, setSearch } from '@/test/next-mocks.utils'

import { UserSettingsNav } from '../UserSettingsNav'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/settings')
  setSearch('')
})

describe('UserSettingsNav', () => {
  it('links to the sections, and marks the one that is open', () => {
    setSearch('section=usage')
    render(<UserSettingsNav />)

    expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: 'Login sessions' })).toHaveAttribute(
      'href',
      '/settings?section=sessions',
    )
  })

  it('marks no section while another page is on screen, such as one of a project', () => {
    setPathname('/projects/p1/settings')
    render(<UserSettingsNav />)

    expect(screen.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current')
  })
})
