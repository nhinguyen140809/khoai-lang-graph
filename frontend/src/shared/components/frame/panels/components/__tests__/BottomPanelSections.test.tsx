import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { BottomPanelSection } from '../../panel.types'
import { BottomPanelSections } from '../BottomPanelSections'
import { sectionTabCases } from './BottomPanelSections.data'

const sections: BottomPanelSection[] = [
  { id: 'step', title: 'Step', content: <p>the step</p> },
  {
    id: 'state',
    title: 'State',
    actions: <button type="button">Copy the state</button>,
    content: <p>the state</p>,
  },
]

describe('BottomPanelSections', () => {
  it('shows the first section first', () => {
    render(<BottomPanelSections sections={sections} />)

    expect(screen.getByRole('tab', { name: 'Step' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('the step')
  })

  it.each(sectionTabCases)('shows the section of the $tab tab', async ({ tab, text }) => {
    render(<BottomPanelSections sections={sections} />)

    await userEvent.click(screen.getByRole('tab', { name: tab }))

    expect(screen.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(text)
  })

  it('keeps a section as it was while another one is shown', async () => {
    render(
      <BottomPanelSections
        sections={[
          { id: 'step', title: 'Step', content: <input aria-label="Filter" /> },
          { id: 'state', title: 'State', content: <p>the state</p> },
        ]}
      />,
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter' }), 'REQ')

    await userEvent.click(screen.getByRole('tab', { name: 'State' }))
    expect(screen.getByLabelText('Filter')).not.toBeVisible()
    await userEvent.click(screen.getByRole('tab', { name: 'Step' }))

    expect(screen.getByRole('textbox', { name: 'Filter' })).toHaveValue('REQ')
  })

  it('shows the actions of the section shown, then the controls', async () => {
    render(
      <BottomPanelSections sections={sections} controls={<button type="button">Hide</button>} />,
    )
    expect(screen.queryByRole('button', { name: 'Copy the state' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'State' }))

    const buttons = screen.getAllByRole('button').map((button) => button.textContent)
    expect(buttons).toEqual(['Copy the state', 'Hide'])
  })
})
