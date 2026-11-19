import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FaceName } from '../FaceName'

describe('FaceName', () => {
  it('shows the name in the colors of the face of the same seed', () => {
    render(<FaceName seed="analyst">Analyst</FaceName>)

    const name = screen.getByText('Analyst')
    expect(name).toHaveClass('face-text')
    expect(name.style.getPropertyValue('--face-a')).not.toBe('')
    expect(name.style.getPropertyValue('--face-b')).not.toBe('')
  })
})
