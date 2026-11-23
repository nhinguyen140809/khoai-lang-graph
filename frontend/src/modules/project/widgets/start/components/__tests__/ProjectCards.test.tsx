import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
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

  it('keeps its heading above the error when the projects fail to load', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.projects.path()))
    renderWithProviders(<ProjectCards />)

    await screen.findByRole('alert')
    await expectRole('heading', 'Your projects')
  })
})
