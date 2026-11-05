import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { renderWithProviders } from '@/test/render'

import { useRestoreVersionDialogStore } from '../../restore-version-dialog.store'
import { RestoreVersionMenuItem } from '../RestoreVersionMenuItem'

const item = itemFixtureByKey(projectIds.mentor, 'AR-007')
const target = { type: 'item' as const, id: item.id }

function renderEntry(lockedReason: string | null = null) {
  return renderWithProviders(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <button type="button">open</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <RestoreVersionMenuItem target={target} version={1} lockedReason={lockedReason} />
      </DropdownMenuContent>
    </DropdownMenu>,
  )
}

describe('RestoreVersionMenuItem', () => {
  it('opens the dialog of the version through its store', async () => {
    const user = userEvent.setup()
    renderEntry()

    await user.click(screen.getByRole('menuitem', { name: 'Restore this version' }))

    expect(useRestoreVersionDialogStore.getState().open).toBe(true)
    expect(useRestoreVersionDialogStore.getState().targetId).toBe(`item:${item.id}@1`)
  })

  it('is disabled with its reason in the tooltip of its wrapper while the record cannot change', async () => {
    const user = userEvent.setup()
    renderEntry('A document can change while it waits for your review.')

    const entry = screen.getByRole('menuitem', { name: 'Restore this version' })
    expect(entry).toHaveAttribute('aria-disabled', 'true')
    await user.hover(assertWrapper(entry))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'A document can change while it waits for your review.',
    )
  })
})

/** The wrapper that carries the tooltip of the disabled entry. */
function assertWrapper(entry: HTMLElement) {
  const wrapper = entry.closest('span')
  if (wrapper === null) throw new Error('The restore entry has no wrapper')
  return wrapper
}
