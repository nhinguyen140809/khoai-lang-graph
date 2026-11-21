import { screen } from '@testing-library/react'
import { FilesIcon } from 'lucide-react'
import { useMemo } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoRole, expectRole, hoverOver, press } from '@/test/steps'

import { useDeskTool } from '../../hooks/useDeskTool'
import { DeskRail } from '../DeskRail'
import { DeskToolsInBar } from '../DeskToolsInBar'

/** Offers a tool, as a page does, and renders nothing in place. */
function Offer({ isActive = false, onSelect = () => undefined }) {
  const icon = useMemo(() => <FilesIcon aria-hidden />, [])
  useDeskTool({ id: 'documents', label: 'Documents', icon, isActive, onSelect })
  return null
}

describe('DeskRail', () => {
  it('shows each tool as a button in a rail, and none while no page offers one', async () => {
    const { rerender } = renderWithProviders(<DeskRail />)
    expectNoRole('navigation', 'Project tools')

    rerender(
      <>
        <Offer />
        <DeskRail />
      </>,
    )

    await expectRole('button', 'Documents')
    await expectRole('navigation', 'Project tools')
  })

  it('names the tool in a tooltip, which the icon alone does not say', async () => {
    renderWithProviders(
      <>
        <Offer />
        <DeskRail />
      </>,
    )

    await hoverOver(await screen.findByRole('button', { name: 'Documents' }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Documents')
  })

  it('shows the tool as pressed while it is open, and selects it when pressed', async () => {
    const onSelect = vi.fn()
    renderWithProviders(
      <>
        <Offer isActive onSelect={onSelect} />
        <DeskRail />
      </>,
    )

    const button = await screen.findByRole('button', { name: 'Documents' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await press(button)

    expect(onSelect).toHaveBeenCalledOnce()
  })
})

describe('DeskToolsInBar', () => {
  it('has no tool to show while no page offers one', () => {
    renderWithProviders(<DeskToolsInBar />)

    expectNoRole('button')
  })
})
