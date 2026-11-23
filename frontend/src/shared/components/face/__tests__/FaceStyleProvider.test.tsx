import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Face } from '../Face'
import { FaceStyleProvider } from '../FaceStyleProvider'

describe('Face with a way of drawing', () => {
  it('draws the plain face when nothing says another way', () => {
    const { container } = render(<Face seed="analyst" />)

    expect(container.querySelector('[data-slot=face]')).toBeInTheDocument()
  })

  it('draws the way that the provider above says', () => {
    const { container } = render(
      <FaceStyleProvider style="plain">
        <Face seed="analyst" mood="happy" />
      </FaceStyleProvider>,
    )

    expect(container.querySelector('[data-slot=face]')).toHaveAttribute('data-mood', 'happy')
  })
})
