import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '../accessibility.utils'

describe('expectNoAccessibilityViolations', () => {
  it('passes for a button with a name', async () => {
    const { container } = render(createElement('button', { type: 'button' }, 'Save'))

    await expectNoAccessibilityViolations(container)
  })

  it('names the rule and the element of a button without a name', async () => {
    const { container } = render(createElement('button', { type: 'button' }))

    await expect(expectNoAccessibilityViolations(container)).rejects.toThrow('button-name')
  })
})
