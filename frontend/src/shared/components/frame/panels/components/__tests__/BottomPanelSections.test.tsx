import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectAttribute, expectFieldValue, expectNoRole, pressRole, typeText } from '@/test/steps'

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

    expectAttribute('tab', 'Step', 'aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('the step')
  })

  it.each(sectionTabCases)('shows the section of the $tab tab', async ({ tab, text }) => {
    render(<BottomPanelSections sections={sections} />)

    await pressRole('tab', tab)

    expectAttribute('tab', tab, 'aria-selected', 'true')
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
    await typeText(screen.getByRole('textbox', { name: 'Filter' }), 'REQ')

    await pressRole('tab', 'State')
    expect(screen.getByLabelText('Filter')).not.toBeVisible()
    await pressRole('tab', 'Step')

    expectFieldValue('Filter', 'REQ')
  })

  it('shows the actions of the section shown, then the controls', async () => {
    render(
      <BottomPanelSections sections={sections} controls={<button type="button">Hide</button>} />,
    )
    expectNoRole('button', 'Copy the state')

    await pressRole('tab', 'State')

    const buttons = screen.getAllByRole('button').map((button) => button.textContent)
    expect(buttons).toEqual(['Copy the state', 'Hide'])
  })
})
