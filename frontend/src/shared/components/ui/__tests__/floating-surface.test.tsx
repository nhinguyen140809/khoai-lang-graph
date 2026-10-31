import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'

import { FloatingSurface } from '../floating-surface'
import { surfaceCases } from './floating-surface.data'

// The rendered surface, the only thing the card under test holds.
function surfaceOf(container: HTMLElement) {
  return assertPresent(
    container.querySelector('[data-slot="floating-surface"]'),
    'The floating surface rendered.',
  )
}

describe('FloatingSurface', () => {
  it.each(surfaceCases)('floats $name', ({ props, classes }) => {
    const { container } = renderWithProviders(<FloatingSurface {...props} />)

    for (const className of classes) {
      expect(surfaceOf(container)).toHaveClass(className)
    }
  })

  it('takes the classes it is given over its own', () => {
    const { container } = renderWithProviders(<FloatingSurface className="z-50 p-6" />)

    expect(surfaceOf(container)).toHaveClass('z-50', 'p-6')
    expect(surfaceOf(container)).not.toHaveClass('z-20', 'p-3')
  })

  it('answers a click and renders as the element it is asked for', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = renderWithProviders(<FloatingSurface as="section" onClick={onClick} />)

    const surface = surfaceOf(container)
    expect(surface.tagName).toBe('SECTION')
    await user.click(surface)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
