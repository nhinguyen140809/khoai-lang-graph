import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoRole, expectRole } from '@/test/steps'

import { Glint } from '../Glint'

describe('Glint', () => {
  it('is a status named Working, unless it is hidden beside words', async () => {
    const { rerender } = render(<Glint />)
    await expectRole('status', 'Working')

    rerender(<Glint aria-hidden />)
    expectNoRole('status')
  })

  it.each(['solid', 'mesh', 'shift'] as const)(
    'fills the star and its glow with the %s fill',
    (variant) => {
      const { container } = render(<Glint variant={variant} />)

      expect(container.querySelectorAll(`[data-variant=${variant}]`)).toHaveLength(2)
    },
  )

  it('gives the two colors to the star as custom properties', () => {
    const { container } = render(<Glint variant="mesh" colors={['red', 'blue']} />)

    expect(container.querySelector('[data-variant=mesh]')).toHaveStyle({
      '--glint-a': 'red',
      '--glint-b': 'blue',
    })
  })
})
