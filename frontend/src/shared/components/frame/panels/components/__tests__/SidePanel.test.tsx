import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SidePanel } from '../SidePanel'

describe('SidePanel', () => {
  it('shows its title and its content', () => {
    render(
      <SidePanel title="Documents">
        <p>The tree</p>
      </SidePanel>,
    )

    expect(screen.getByRole('complementary', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByText('The tree')).toBeInTheDocument()
  })

  it('shows a footer under the content', () => {
    render(
      <SidePanel title="Documents" footer={<span>18 to review</span>}>
        <p>The tree</p>
      </SidePanel>,
    )

    expect(
      screen.getByText('18 to review').compareDocumentPosition(screen.getByText('The tree')),
    ).toBe(Node.DOCUMENT_POSITION_PRECEDING)
  })

  it('shows no footer row without a footer', () => {
    const { container } = render(
      <SidePanel title="Documents">
        <p>The tree</p>
      </SidePanel>,
    )

    expect(container.querySelector('.border-t')).toBeNull()
  })
})
