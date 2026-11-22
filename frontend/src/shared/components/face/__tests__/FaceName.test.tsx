import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FaceName } from '../FaceName'
import { FacePlacesProvider } from '../FacePlacesProvider'

describe('FaceName', () => {
  it('shows the name in the colors of the face of the same seed', () => {
    render(<FaceName seed="analyst">Analyst</FaceName>)

    const name = screen.getByText('Analyst')
    expect(name).toHaveClass('face-text')
    expect(name.style.getPropertyValue('--face-a')).not.toBe('')
    expect(name.style.getPropertyValue('--face-b')).not.toBe('')
  })
})

describe('FaceName with the places of a workflow', () => {
  it('has the colors of the face at the place of the agent, as the face beside it has', () => {
    const seeds = ['planner', 'analyst']
    render(
      <FacePlacesProvider seeds={seeds}>
        <FaceName seed="analyst">Placed</FaceName>
        <FaceName seed="other" place={1}>
          Given
        </FaceName>
      </FacePlacesProvider>,
    )

    expect(screen.getByText('Placed').style.getPropertyValue('--face-a')).toBe(
      screen.getByText('Given').style.getPropertyValue('--face-a'),
    )
  })
})
