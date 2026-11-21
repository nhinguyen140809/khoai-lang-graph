import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoRole, expectRole } from '@/test/steps'

import { Rings } from '../Rings'

describe('Rings', () => {
  it('is a status that says the work goes on, unless it is hidden beside words', async () => {
    const { rerender } = render(<Rings />)

    await expectRole('status', 'Working')

    rerender(<Rings aria-hidden />)

    expectNoRole('status')
  })

  it('takes the primary and the secondary color, or the two that it is given', () => {
    const { container, rerender } = render(<Rings />)
    const strokes = () => [...container.querySelectorAll('path')].map((path) => path.style.stroke)

    expect(strokes()).toEqual(['var(--primary)', 'var(--secondary)'])

    rerender(<Rings colors={['red', 'blue']} />)

    expect(strokes()).toEqual(['red', 'blue'])
  })
})
