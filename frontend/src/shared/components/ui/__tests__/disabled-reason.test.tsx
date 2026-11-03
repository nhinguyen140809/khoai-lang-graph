import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { Button } from '../button'
import { DisabledReason } from '../disabled-reason'

const reason = 'Documents cannot change while the agents work.'

/** An Edit button that the rule of the screen disables when a reason is given. */
function renderEdit(given: string | null) {
  return renderWithProviders(
    <DisabledReason reason={given}>
      <Button disabled={given !== null}>Edit</Button>
    </DisabledReason>,
  )
}

/** The wrapper that carries the tooltip of the disabled button. */
function wrapperOfTrigger() {
  return assertPresent(
    screen.getByRole('button', { name: 'Edit' }).parentElement,
    'The disabled button has no wrapper',
  )
}

describe('DisabledReason', () => {
  it('leaves the control alone without a reason', async () => {
    const user = userEvent.setup()
    const { container } = renderEdit(null)

    const button = screen.getByRole('button', { name: 'Edit' })
    expect(container.firstElementChild).toBe(button)
    await user.hover(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the reason in a tooltip on hover, as the description of the wrapper', async () => {
    const user = userEvent.setup()
    renderEdit(reason)

    const wrapper = wrapperOfTrigger()
    await user.hover(wrapper)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(reason)
    expect(wrapper).toHaveAccessibleDescription(reason)
  })

  it('shows the reason in a tooltip on focus', async () => {
    renderEdit(reason)

    wrapperOfTrigger().focus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(reason)
  })

  it('has no accessibility violation', async () => {
    const { container } = renderEdit(reason)
    await screen.findByRole('button', { name: 'Edit' })

    await expectNoAccessibilityViolations(container)
  })
})
