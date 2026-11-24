import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AgentFace } from '../AgentFace'
import { FaceStyleProvider } from '../FaceStyleProvider'

describe('AgentFace with a way of drawing', () => {
  it('draws the plain face when nothing says another way', () => {
    const { container } = render(<AgentFace seed="analyst" />)

    expect(container.querySelector('[data-slot=face]')).toBeInTheDocument()
  })

  it('draws the way that the provider above says', () => {
    const { container } = render(
      <FaceStyleProvider style="plain">
        <AgentFace seed="analyst" mood="happy" />
      </FaceStyleProvider>,
    )

    expect(container.querySelector('[data-slot=face]')).toHaveAttribute('data-mood', 'happy')
  })
})
