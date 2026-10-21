import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStatusBarItem } from '../../hooks/useStatusBarItem'
import { useStatusBarStore } from '../../status-bar.store'
import { type StatusBarItem, StatusBarSide } from '../../status-bar.types'
import { StatusBar } from '../StatusBar'

/** A component that reports `item` in the status bar while it is mounted. */
function Reports({ item }: { item: StatusBarItem }) {
  useStatusBarItem(item)
  return null
}

/** An item whose content fails to render. */
function Broken(): never {
  throw new Error('The item failed.')
}

beforeEach(() => {
  useStatusBarStore.setState(useStatusBarStore.getInitialState())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StatusBar', () => {
  it('leaves out an item that fails to render, and keeps the others', () => {
    // React reports the error that the boundary catches.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <>
        <StatusBar />
        <Reports item={{ side: StatusBarSide.Left, content: <Broken /> }} />
        <Reports item={{ side: StatusBarSide.Left, content: <span>Run 1: running</span> }} />
      </>,
    )

    expect(screen.getByText('Run 1: running')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
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

    expect(screen.queryByText('Run 1: running')).not.toBeInTheDocument()
  })

  it('shows the notifications when nothing is reported', async () => {
    render(<StatusBar />)

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByText('Nothing new.')).toBeInTheDocument()
  })
})
