import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TestProviders } from '@/test/TestProviders'

import { CopyEntryAction } from '../CopyEntryAction'
import { copyCases } from './CopyEntryAction.data'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CopyEntryAction', () => {
  it.each(copyCases)('$name', async ({ writeText, toast: kind, message }) => {
    const user = userEvent.setup()
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText)
    const shown = vi.spyOn(toast, kind)
    render(<CopyEntryAction text="Find a mentor." />, { wrapper: TestProviders })

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(write).toHaveBeenCalledWith('Find a mentor.')
    expect(shown).toHaveBeenCalledWith(message)
  })
})
