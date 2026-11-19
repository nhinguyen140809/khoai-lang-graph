import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type * as urlModule from '@/shared/lib/url'
import { renderWithProviders } from '@/test/render'
import { expectNoRole, pressButton, spyOnToast, waitForCall } from '@/test/steps'

import { ExportDialog } from '../ExportDialog'
import { ExportDownloads } from '../ExportDownloads'
import { ExportProjectButton } from '../ExportProjectButton'

const { downloadFile } = vi.hoisted(() => ({ downloadFile: vi.fn() }))

vi.mock('@/shared/lib/url', async (importOriginal) => ({
  ...(await importOriginal<typeof urlModule>()),
  downloadFile,
}))

const projectId = projectIds.mentor

/** Answers every read of an export with this status, as if its file were prepared at once. */
function answerExportAs(status: 'ready' | 'failed') {
  server.use(
    http.get(apiEndpoints.exportEntry.pattern, ({ params }) =>
      HttpResponse.json({
        id: String(params.exportId),
        project_id: projectId,
        template: 'full_project',
        format: 'json',
        status,
        file_name: 'full_project.json',
        size_bytes: status === 'ready' ? 2048 : null,
        download_url: status === 'ready' ? '/files/full_project.json' : null,
        requested_by: 'u1',
        included_artifacts: [],
        created_at: '2026-11-14T08:00:00Z',
      }),
    ),
  )
}

function renderExport() {
  renderWithProviders(
    <>
      <ExportProjectButton />
      <ExportDialog projectId={projectId} />
      <ExportDownloads />
    </>,
  )
}

/** Opens the dialog, chooses all the documents, and asks for them. */
async function exportAllDocuments() {
  await pressButton('Export')
  const dialog = await screen.findByRole('dialog', { name: 'Export' })
  await userEvent.click(within(dialog).getByRole('button', { name: /All documents/ }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Export' }))
  return dialog
}

describe('ExportDialog', () => {
  it('opens on the first document, with the first of its file types', async () => {
    renderExport()

    await pressButton('Export')

    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    expect(
      within(dialog).getByRole('checkbox', { name: 'Requirement specification' }),
    ).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).not.toBeChecked()
    expect(within(dialog).getByRole('radio', { name: 'Markdown' })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: 'PDF' })).toBeInTheDocument()
  })

  it('offers the file types that every chosen document offers', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'User stories' }))

    expect(within(dialog).getByRole('radio', { name: 'Markdown' })).toBeChecked()
    expect(within(dialog).queryByRole('radio', { name: 'PDF' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('radio', { name: 'CSV' })).not.toBeInTheDocument()
  })

  it('chooses all the documents with a button, and turns the list off meanwhile', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })

    await userEvent.click(within(dialog).getByRole('button', { name: /All documents/ }))

    expect(within(dialog).getByRole('button', { name: /All documents/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).toBeDisabled()
    expect(within(dialog).getByRole('radio', { name: 'JSON' })).toBeInTheDocument()
  })

  it('selects and clears every document of the list at once', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Select all' }))
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).toBeChecked()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Clear' }))
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).not.toBeChecked()
  })

  it('asks for one file for each document chosen', async () => {
    const loading = spyOnToast('loading')
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'User stories' }))

    await userEvent.click(within(dialog).getByRole('button', { name: 'Export' }))

    await waitForCall(loading, 'Preparing Requirement specification (Markdown)', expect.anything())
    await waitForCall(loading, 'Preparing User stories (Markdown)', expect.anything())
  })

  it('closes once the export is asked for, and says that the file is being prepared', async () => {
    const loading = spyOnToast('loading')
    renderExport()

    await exportAllDocuments()

    await waitForCall(loading, 'Preparing All documents (Markdown)', expect.anything())
    expectNoRole('dialog', 'Export')
  })

  it('downloads the file once it is ready, and offers to download it again', async () => {
    answerExportAs('ready')
    const success = spyOnToast('success')
    renderExport()

    await exportAllDocuments()

    await waitForCall(downloadFile, '/files/full_project.json', 'full_project.json')
    await waitForCall(success, 'All documents (JSON) is ready', expect.anything())
    expect(downloadFile).toHaveBeenCalledOnce()
  })

  it('says that the export failed, and offers to try again', async () => {
    answerExportAs('failed')
    const error = spyOnToast('error')
    renderExport()

    await exportAllDocuments()

    await waitForCall(error, 'The export failed.', expect.anything())
    expect(downloadFile).not.toHaveBeenCalled()
  })
})
