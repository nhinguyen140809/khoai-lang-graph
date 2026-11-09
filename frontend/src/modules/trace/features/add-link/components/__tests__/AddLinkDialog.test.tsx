import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { openPage, recordRequests } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { fillFields, pressButton, pressKeys, spyOnToast, typeText } from '@/test/steps'

import { addLinkMessages } from '../../add-link.constants'
import { AddLinkDialog } from '../AddLinkDialog'
import { fieldCases, lockedSource, persona, projectId, source } from './AddLinkDialog.data'

function renderDialog(item = source) {
  return renderWithProviders(
    <AddLinkDialog
      projectId={projectId}
      source={item}
      open
      onOpenChange={() => undefined}
      onClosed={() => undefined}
    />,
  )
}

/** Chooses the other item of the link: typing into its search, then the first result with the
 * keyboard, since the popup of the combobox sits outside the dialog that opened it. */
async function chooseTarget(title: string) {
  await typeText(screen.getByLabelText(addLinkMessages.target), title.slice(0, 4))
  await screen.findByText(title)
  await pressKeys('{ArrowDown}{Enter}')
}

describe('AddLinkDialog', () => {
  it.each(fieldCases)('asks for $name before sending', async ({ typed, messages }) => {
    const requests = recordRequests()
    renderDialog()

    await fillFields(typed)
    await pressButton(addLinkMessages.add)

    for (const message of messages) expect(await screen.findByText(message)).toBeInTheDocument()
    expect(requests.filter(({ method }) => method === HttpMethod.Post)).toEqual([])
  })

  it('names the dialog after the item, and says what a link is', async () => {
    renderDialog()

    expect(
      await screen.findByText('Link Search with free hours to another item'),
    ).toBeInTheDocument()
    expect(screen.getByText(addLinkMessages.description)).toBeInTheDocument()
  })

  it('chooses the first kind of link of the item', async () => {
    renderDialog()
    await screen.findByText('Link Search with free hours to another item')

    expect(screen.getByRole('combobox', { name: addLinkMessages.linkType })).toHaveTextContent(
      'Involves',
    )
  })

  it('shows the sentence of the link once both are chosen', async () => {
    renderDialog()

    await chooseTarget('Minh')

    expect(await screen.findByText('Search with free hours will involve Minh.')).toBeInTheDocument()
  })

  it('makes a link from the chosen kind, item and note', async () => {
    const requests = recordRequests()
    renderDialog()

    await chooseTarget('Minh')
    await fillFields({ Note: 'Check this first.' })
    await pressButton(addLinkMessages.add)

    await waitFor(() => {
      const made = requests.filter(
        ({ method, path }) => method === HttpMethod.Post && path.includes('trace-links'),
      )
      expect(made.at(-1)?.body).toMatchObject({
        source_item_id: source.id,
        target_item_id: persona.id,
        link_type: 'involves',
        note: 'Check this first.',
      })
    })
  })

  it('sends null for an empty note', async () => {
    const requests = recordRequests()
    renderDialog()

    await chooseTarget('Minh')
    await pressButton(addLinkMessages.add)

    await waitFor(() => {
      const made = requests.filter(({ method }) => method === HttpMethod.Post)
      expect(made.at(-1)?.body).toMatchObject({ note: null })
    })
  })

  it('shows the problem of the field that the API names', async () => {
    server.use(
      http.post(apiEndpoints.projectTraceLinks.pattern, () =>
        HttpResponse.json(
          {
            code: 'validation_failed',
            title: 'Invalid request',
            detail: 'The link was refused.',
            errors: [{ field: 'target_item_id', message: 'Choose an item that the type allows.' }],
          },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    )
    renderDialog()

    await chooseTarget('Minh')
    await pressButton(addLinkMessages.add)

    expect(await screen.findByText('Choose an item that the type allows.')).toBeInTheDocument()
  })

  it('says the reason of a document that cannot change, under the form', async () => {
    renderDialog(lockedSource)

    await chooseTarget('Search with free hours')
    await pressButton(addLinkMessages.add)

    expect(
      await screen.findByText(/An artifact changes only during a review that allows edits/),
    ).toBeInTheDocument()
  })

  it('toasts the result of making a link', async () => {
    const success = spyOnToast('success')
    const error = spyOnToast('error')
    renderDialog()

    await chooseTarget('Minh')
    await pressButton(addLinkMessages.add)

    await vi.waitFor(() => {
      expect(success).toHaveBeenCalledOnce()
    })
    expect(success.mock.calls[0]?.[0]).toBe(addLinkMessages.added)
    expect(error).not.toHaveBeenCalled()
  })

  it('toasts when making the link fails', async () => {
    openPage('/?mock-create-trace-link=error')
    const success = spyOnToast('success')
    renderDialog()

    await chooseTarget('Minh')
    await pressButton(addLinkMessages.add)

    // A failure keeps its words in the form, under the fields, and the dialog stays open.
    expect(await screen.findByText('Failed to add the link (HTTP 500)')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(success).not.toHaveBeenCalled()
  })
})
