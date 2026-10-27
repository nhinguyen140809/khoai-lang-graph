import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Broken } from '@/test/render'
import { expectNoText, expectRole, expectText, pressButton } from '@/test/steps'

import { useStatusBarItem } from '../../hooks/useStatusBarItem'
import { type StatusBarItem, StatusBarSide } from '../../status-bar.types'
import { StatusBar } from '../StatusBar'

/** A component that reports `item` in the status bar while it is mounted. */
function Reports({ item }: { item: StatusBarItem }) {
  useStatusBarItem(item)
  return null
}

describe('StatusBar', () => {
  it('leaves out an item that fails to render, and keeps the others', async () => {
    // React reports the error that the boundary catches.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <>
        <StatusBar />
        <Reports item={{ side: StatusBarSide.Left, content: <Broken /> }} />
        <Reports item={{ side: StatusBarSide.Left, content: <span>Run 1: running</span> }} />
      </>,
    )

    await expectText('Run 1: running')
    await expectRole('button', 'Notifications')
  })

  it('shows the items registered, each on its side and in its order', () => {
    render(
      <>
        <StatusBar />
        <Reports item={{ side: StatusBarSide.Right, content: <span>Ln 4</span> }} />
        <Reports item={{ side: StatusBarSide.Left, order: 2, content: <span>Cost $0.40</span> }} />
        <Reports
          item={{ side: StatusBarSide.Left, order: 1, content: <span>Run 1: running</span> }}
        />
      </>,
    )

    const run = screen.getByText('Run 1: running')
    const cost = screen.getByText('Cost $0.40')
    const line = screen.getByText('Ln 4')
    expect(run.compareDocumentPosition(cost)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(cost.compareDocumentPosition(line)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(
      line.compareDocumentPosition(screen.getByRole('button', { name: 'Notifications' })),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('drops the item of a component that leaves', () => {
    const { rerender } = render(
      <>
        <StatusBar />
        <Reports item={{ side: StatusBarSide.Left, content: <span>Run 1: running</span> }} />
      </>,
    )

    rerender(<StatusBar />)

    expectNoText('Run 1: running')
  })

  it('shows the notifications when nothing is reported', async () => {
    render(<StatusBar />)

    await pressButton('Notifications')
    await expectText('Nothing new.')
  })
})
