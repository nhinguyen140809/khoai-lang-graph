import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { ExportButton } from '../ExportButton'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

describe('ExportButton', () => {
  it('offers the templates of the workflow and the formats of the chosen one', async () => {
    render(<ExportButton projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))

    const template = await screen.findByRole('combobox', { name: 'Template' })
    expect(template).toHaveTextContent('Requirement specification')
    await userEvent.click(screen.getByRole('combobox', { name: 'Format' }))
    expect(await screen.findByRole('option', { name: 'docx' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'pdf' })).toBeVisible()
  })

  it('asks for the export and offers the file when it is ready', async () => {
    render(<ExportButton projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    await screen.findByRole('combobox', { name: 'Template' })

    const submit = screen.getAllByRole('button', { name: 'Export' }).at(-1)
    if (submit === undefined) throw new Error('No submit button')
    await userEvent.click(submit)

    expect(await screen.findByText(/Making requirement_specification\.md/)).toBeVisible()
    const download = await screen.findByRole(
      'link',
      { name: /Download requirement_specification\.md/ },
      { timeout: 5000 },
    )
    expect(download).toHaveAttribute('href', expect.stringContaining('/file'))
  })
})
