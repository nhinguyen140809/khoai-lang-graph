import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Collapsible, CollapsibleContent } from '../collapsible'

describe('CollapsibleContent', () => {
  it('carries the grow motion while it is open', () => {
    render(
      <Collapsible open>
        <CollapsibleContent>inside</CollapsibleContent>
      </Collapsible>,
    )

    expect(screen.getByText('inside')).toHaveClass('data-[state=open]:animate-collapsible-down')
  })

  it('keeps the classes it is given', () => {
    render(
      <Collapsible open>
        <CollapsibleContent className="px-2">inside</CollapsibleContent>
      </Collapsible>,
    )

    expect(screen.getByText('inside')).toHaveClass('px-2')
  })

  it('opens and closes for as long as it is asked to', () => {
    render(
      <Collapsible open>
        <CollapsibleContent duration={700}>inside</CollapsibleContent>
      </Collapsible>,
    )

    expect(screen.getByText('inside')).toHaveStyle({ animationDuration: '700ms' })
  })
})
