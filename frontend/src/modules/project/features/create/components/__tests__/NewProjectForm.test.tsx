import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { IdPrefix } from '@/mocks/shared/db/mock-ids.constants'
import { createdId } from '@/mocks/shared/db/mock-ids.utils'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { routerMock } from '@/test/next-stubs/next-stubs.utils'
import { TestProviders } from '@/test/render/TestProviders'

import { NewProjectForm } from '../NewProjectForm'
import { blankIdeas, createCases, failedCreateCases, failedSendCases } from './NewProjectForm.data'

vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-stubs/next-stubs.utils')).navigationMock,
)

const IDEA = 'Mentor platform for students.'
const activity = `/projects/${createdId(IdPrefix.Project, 1)}/activity`

function renderForm(onCreated = vi.fn()) {
  render(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Create project</DialogTitle>
        <NewProjectForm idea={IDEA} defaultLanguage="vi" onCreated={onCreated} />
      </DialogContent>
    </Dialog>,
    { wrapper: TestProviders },
  )
  return onCreated
}

/** Replaces the text of a field with a paste, which takes an empty text too. */
async function replace(name: string, text: string) {
  await userEvent.clear(screen.getByRole('textbox', { name }))
  await userEvent.paste(text)
}

const create = () => userEvent.click(screen.getByRole('button', { name: 'Create project' }))

/** The address and the body of each POST request, in the order they are sent. */
function recordPosts() {
  const sent: [string, unknown][] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method !== 'POST') return
    const path = new URL(request.url).pathname
    sent.push([path, null])
    const entry = sent.length - 1
    void request
      .clone()
      .json()
      .then((json: unknown) => {
        sent[entry] = [path, json]
      })
  })
  return sent
}

beforeEach(() => {
  routerMock.push.mockClear()
})

afterEach(() => {
  server.events.removeAllListeners()
  vi.restoreAllMocks()
})

describe('NewProjectForm', () => {
  it('starts without a name, with the idea and the language given', () => {
    renderForm()

    expect(screen.getByRole('textbox', { name: 'Name (optional)' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Idea' })).toHaveValue(IDEA)
    expect(screen.getByRole('combobox', { name: 'Language of the documents' })).toHaveTextContent(
      'Vietnamese',
    )
  })

  it('shows the defaults of the runs once their settings open, and they cannot be changed yet', async () => {
    renderForm()
    expect(screen.queryByRole('spinbutton', { name: 'Personas' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Agent settings' }))

    const personas = screen.getByRole('spinbutton', { name: 'Personas' })
    expect(personas).toHaveValue(3)
    expect(personas).toBeDisabled()
    const reviews = screen.getAllByRole('checkbox')
    expect(reviews).toHaveLength(3)
    for (const review of reviews) {
      expect(review).toBeChecked()
      expect(review).toBeDisabled()
    }
  })

  it.each(blankIdeas)('asks for the idea instead of %j', async (idea) => {
    renderForm()

    await replace('Idea', idea)
    await create()

    expect(await screen.findByText('Describe the idea.')).toBeInTheDocument()
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it.each(createCases)(
    '$name, then opens the activity of the project',
    async ({ projectName, idea, language, sent }) => {
      const posts = recordPosts()
      const onCreated = renderForm()

      if (projectName !== null) await replace('Name (optional)', projectName)
      if (idea !== null) await replace('Idea', idea)
      await userEvent.click(screen.getByRole('combobox', { name: 'Language of the documents' }))
      await userEvent.click(await screen.findByRole('option', { name: language }))
      await create()

      await vi.waitFor(() => {
        expect(routerMock.push).toHaveBeenCalledWith(activity)
      })
      expect(posts).toEqual(sent)
      expect(onCreated).toHaveBeenCalledOnce()
    },
  )

  it.each(failedCreateCases)('shows $name', async ({ answer, message }) => {
    server.use(http.post('/api/v1/projects', answer))
    const onCreated = renderForm()

    await create()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(routerMock.push).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it.each(failedSendCases)(
    'opens the project created, with a toast, when $request fails',
    async ({ path, reason }) => {
      const error = vi.spyOn(toast, 'error')
      server.use(http.post(path, () => new HttpResponse(null, { status: 500 })))
      renderForm()

      await create()

      await vi.waitFor(() => {
        expect(routerMock.push).toHaveBeenCalledWith(activity)
      })
      expect(error).toHaveBeenCalledWith('The project is created, but its idea was not sent.', {
        description: reason,
      })
    },
  )
})
