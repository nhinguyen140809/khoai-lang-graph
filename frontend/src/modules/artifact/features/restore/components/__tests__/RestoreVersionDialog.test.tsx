import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'
import { spyOnToast } from '@/test/steps'

import { RestoreVersionDialog } from '../RestoreVersionDialog'

const item = itemFixtureByKey(projectIds.mentor, 'AR-007')

describe('RestoreVersionDialog', () => {
  it('restores the version, closes with a toast, and reloads what follows', async () => {
    const user = userEvent.setup()
    const toasts = spyOnToast('success')
    const onChanged = vi.fn()
    renderWithProviders(
      <RestoreVersionDialog
        revisionKey={`item:${item.id}@1`}
        open
        onOpenChange={() => undefined}
        onClosed={() => undefined}
        onChanged={onChanged}
      />,
    )

    await user.click(await screen.findByRole('button', { name: 'Restore' }))

    expect(toasts).toHaveBeenCalledWith('Restored version 1')
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('renders nothing for a string that is no key of a version', () => {
    const { container } = renderWithProviders(
      <RestoreVersionDialog
        revisionKey="not-a-key"
        open
        onOpenChange={() => undefined}
        onClosed={() => undefined}
        onChanged={() => undefined}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('stays open with a toast when the restore fails', async () => {
    const user = userEvent.setup()
    const toasts = spyOnToast('error')
    // The specification is not under review: the mock refuses the change.
    const specificationItem = itemFixtureByKey(projectIds.mentor, 'REQ-001')
    renderWithProviders(
      <RestoreVersionDialog
        revisionKey={`item:${specificationItem.id}@1`}
        open
        onOpenChange={() => undefined}
        onClosed={() => undefined}
        onChanged={() => undefined}
      />,
    )

    await user.click(await screen.findByRole('button', { name: 'Restore' }))

    expect(toasts).toHaveBeenCalledWith(
      'This document cannot change now. It can change while it waits for your review.',
    )
  })

  it('speaks of a document when the record is an artifact', async () => {
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
    renderWithProviders(
      <RestoreVersionDialog
        revisionKey={`artifact:${analysis.id}@2`}
        open
        onOpenChange={() => undefined}
        onClosed={() => undefined}
        onChanged={() => undefined}
      />,
    )

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'Restore version 2 of this document?',
    )
    expect(screen.getByText(/The document and each of its items/)).toBeInTheDocument()
  })
})
