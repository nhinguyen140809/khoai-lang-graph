import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { renderWithProviders } from '@/test/render'
import {
  expectNoRole,
  expectRole,
  press,
  pressButton,
  pressRole,
  spyOnToast,
  waitForCall,
} from '@/test/steps'

import { ExportDialog } from '../ExportDialog'
import { ExportDownloads } from '../ExportDownloads'
import { ExportProjectButton } from '../ExportProjectButton'

const { downloadFile } = vi.hoisted(() => ({ downloadFile: vi.fn() }))

vi.mock('@/shared/lib/files', () => ({ downloadFile }))

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
  await press(within(dialog).getByRole('checkbox', { name: 'All documents' }))
  await press(within(dialog).getByRole('button', { name: 'Export' }))
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
    expect(
      within(dialog).getByRole('combobox', { name: 'File type of Requirement specification' }),
    ).toHaveTextContent('Markdown')
  })

  it('turns the select of a document off until the document is chosen', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    const stories = within(dialog).getByRole('combobox', { name: 'File type of User stories' })
    expect(stories).toBeDisabled()

    await press(within(dialog).getByRole('checkbox', { name: 'User stories' }))

    expect(stories).toBeEnabled()
  })

  it('gives each chosen document the file types that it offers itself', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    await press(within(dialog).getByRole('checkbox', { name: 'User stories' }))

    await press(
      within(dialog).getByRole('combobox', { name: 'File type of Requirement specification' }),
    )
    await expectRole('option', 'PDF')
    expectNoRole('option', 'CSV')
    await pressRole('option', 'PDF')

    await press(within(dialog).getByRole('combobox', { name: 'File type of User stories' }))
    await expectRole('option', 'CSV')
    expectNoRole('option', 'PDF')
  })

  it('chooses all the documents with a card of its own, which has its own file type, and turns the list off meanwhile', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })

    await press(within(dialog).getByRole('checkbox', { name: 'All documents' }))

    expect(within(dialog).getByRole('checkbox', { name: 'All documents' })).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).toBeDisabled()
    expect(
      within(dialog).getByRole('combobox', { name: 'File type of All documents' }),
    ).toHaveTextContent('JSON')
  })

  it('selects and clears every document of the list at once', async () => {
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })

    await press(within(dialog).getByRole('button', { name: 'Select all' }))
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).toBeChecked()

    await press(within(dialog).getByRole('button', { name: 'Clear' }))
    expect(within(dialog).getByRole('checkbox', { name: 'User stories' })).not.toBeChecked()
  })

  it('asks for one file for each document chosen, each in the file type chosen for it', async () => {
    const loading = spyOnToast('loading')
    renderExport()
    await pressButton('Export')
    const dialog = await screen.findByRole('dialog', { name: 'Export' })
    await press(within(dialog).getByRole('checkbox', { name: 'User stories' }))
    await press(
      within(dialog).getByRole('combobox', { name: 'File type of Requirement specification' }),
    )
    await pressRole('option', 'PDF')
    await press(within(dialog).getByRole('combobox', { name: 'File type of User stories' }))
    await pressRole('option', 'CSV')

    await press(within(dialog).getByRole('button', { name: 'Export' }))

    await waitForCall(loading, 'Preparing Requirement specification (PDF)', expect.anything())
    await waitForCall(loading, 'Preparing User stories (CSV)', expect.anything())
  })

  it('closes once the export is asked for, and says that the file is being prepared', async () => {
    const loading = spyOnToast('loading')
    renderExport()

    await exportAllDocuments()

    await waitForCall(loading, 'Preparing All documents (JSON)', expect.anything())
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
