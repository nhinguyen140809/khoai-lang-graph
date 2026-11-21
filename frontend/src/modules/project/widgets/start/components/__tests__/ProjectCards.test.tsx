import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectRole } from '@/test/steps'

import { ProjectCards } from '../ProjectCards'

describe('ProjectCards', () => {
  it('lists the projects of the user as links that open them, with a link on to all of them', async () => {
    renderWithProviders(<ProjectCards />)

    const list = await screen.findByRole('list')
    const links = await within(list).findAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')).toMatch(/^\/projects\/[^/]+$/)
    await expectRole('link', 'All projects')
  })
})
