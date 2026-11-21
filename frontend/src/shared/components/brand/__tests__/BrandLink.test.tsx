import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { routes, userRoutes } from '@/shared/routes'
import { renderWithProviders } from '@/test/render'

import { BrandLink } from '../BrandLink'

describe('BrandLink', () => {
  it('leads to the home page that it is given, under the name of the app', () => {
    renderWithProviders(<BrandLink href={routes.home()} />)

    expect(screen.getByRole('link', { name: 'khoai' })).toHaveAttribute('href', routes.home())
  })

  it('shows the name alone, without the mark, when it is asked to', () => {
    const { container } = renderWithProviders(<BrandLink href={userRoutes.home()} display="name" />)

    expect(screen.getByRole('link', { name: 'khoai' })).toHaveAttribute('href', userRoutes.home())
    expect(container.querySelector('svg')).toBeNull()
  })

  it('shows the mark before the name by default', () => {
    const { container } = renderWithProviders(<BrandLink href={routes.home()} />)

    expect(container.querySelector('svg')).not.toBeNull()
  })
})
