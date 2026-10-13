import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStatusBarItem } from '../../hooks/useStatusBarItem'
import { StatusBarSide } from '../../status-bar.constants'
import { useStatusBarStore } from '../../status-bar.store'
import type { StatusBarItem } from '../../status-bar.types'
import { StatusBar } from '../StatusBar'

/** A component that reports `item` in the status bar while it is mounted. */
function Reports({ item }: { item: StatusBarItem }) {
  useStatusBarItem(item)
  return null
}

beforeEach(() => {
  useStatusBarStore.setState(useStatusBarStore.getInitialState())
})

describe('StatusBar', () => {
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

    expect(screen.queryByText('Run 1: running')).not.toBeInTheDocument()
  })

  it('shows the notifications when nothing is reported', async () => {
    render(<StatusBar />)

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByText('Nothing new.')).toBeInTheDocument()
  })
})
