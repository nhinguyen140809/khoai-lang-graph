import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type * as urlModule from '@/shared/lib/url'
import { renderWithProviders } from '@/test/render'
import { pressButton, spyOnToast, waitForCall } from '@/test/steps'

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
  await userEvent.click(within(dialog).getByRole('radio', { name: 'All documents' }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Export' }))
  return dialog
}

describe('ExportDialog', () => {
  it('opens on the first template, with the first of its formats', async () => {
    renderExport()

    await pressButton('Export')

    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    expect(within(dialog).getByRole('radio', { name: 'Requirement specification' })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: 'Markdown' })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: 'PDF' })).toBeInTheDocument()
  })

  it('offers the formats of the template chosen, the first one chosen', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })

    await userEvent.click(within(dialog).getByRole('radio', { name: 'User stories' }))

    expect(within(dialog).getByRole('radio', { name: 'Markdown' })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: 'CSV' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('radio', { name: 'PDF' })).not.toBeInTheDocument()
  })

  it('closes once the export is asked for, and says that the file is being prepared', async () => {
    const loading = spyOnToast('loading')
    renderExport()

    await exportAllDocuments()

    await waitForCall(loading, 'Preparing All documents (JSON)', expect.anything())
    expect(screen.queryByRole('dialog', { name: 'Export' })).not.toBeInTheDocument()
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
