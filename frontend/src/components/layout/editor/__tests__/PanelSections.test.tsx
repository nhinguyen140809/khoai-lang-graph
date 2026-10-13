import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { type PanelSection, PanelSections } from '../PanelSections'

const sections: PanelSection[] = [
  { id: 'step', title: 'Step', content: <p>the step</p> },
  {
    id: 'state',
    title: 'State',
    actions: <button type="button">Copy the state</button>,
    content: <p>the state</p>,
  },
]

describe('PanelSections', () => {
  it('shows the first section, and another one from its tab', async () => {
    render(<PanelSections sections={sections} />)

    expect(screen.getByRole('tab', { name: 'Step' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('the step')

    await userEvent.click(screen.getByRole('tab', { name: 'State' }))

    expect(screen.getByRole('tabpanel')).toHaveTextContent('the state')
  })

  it('shows the actions of the section shown, then the controls', async () => {
    render(<PanelSections sections={sections} controls={<button type="button">Hide</button>} />)
    expect(screen.queryByRole('button', { name: 'Copy the state' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'State' }))

    const buttons = screen.getAllByRole('button').map((button) => button.textContent)
    expect(buttons).toEqual(['Copy the state', 'Hide'])
  })
})
