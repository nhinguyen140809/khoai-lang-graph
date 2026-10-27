import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { createdId, IdPrefix } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { serverError } from '@/test/msw'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectFieldValue,
  expectNoRole,
  expectPushedTo,
  expectText,
  pasteText,
  pressButton,
  pressRole,
  spyOnToast,
} from '@/test/steps'

import { NewProjectForm } from '../NewProjectForm'
import { blankIdeas, createCases, failedCreateCases, failedSendCases } from './NewProjectForm.data'

const IDEA = 'Mentor platform for students.'
const activity = `/projects/${createdId(IdPrefix.Project, 1)}/activity`

function renderForm(onCreated = vi.fn()) {
  renderWithProviders(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Create project</DialogTitle>
        <NewProjectForm idea={IDEA} defaultLanguage="vi" onCreated={onCreated} />
      </DialogContent>
    </Dialog>,
  )
  return onCreated
}

/** Replaces the text of a field with a paste, which takes an empty text too. */
async function replace(name: string, text: string) {
  await userEvent.clear(screen.getByRole('textbox', { name }))
  await pasteText(text)
}

const create = () => pressButton('Create project')

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

describe('NewProjectForm', () => {
  it('starts without a name, with the idea and the language given', () => {
    renderForm()

    expectFieldValue('Name (optional)', '')
    expectFieldValue('Idea', IDEA)
    expect(screen.getByRole('combobox', { name: 'Language of the documents' })).toHaveTextContent(
      'Vietnamese',
    )
  })

  it('shows the defaults of the runs once their settings open, and they cannot be changed yet', async () => {
    renderForm()
    expectNoRole('spinbutton', 'Personas')

    await pressButton('Agent settings')

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

    await expectText('Describe the idea.')
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it.each(createCases)(
    '$name, then opens the activity of the project',
    async ({ projectName, idea, language, sent }) => {
      const posts = recordPosts()
      const onCreated = renderForm()

      if (projectName !== null) await replace('Name (optional)', projectName)
      if (idea !== null) await replace('Idea', idea)
      await pressRole('combobox', 'Language of the documents')
      await pressRole('option', language)
      await create()

      await expectPushedTo(activity)
      expect(posts).toEqual(sent)
      expect(onCreated).toHaveBeenCalledOnce()
    },
  )

  it.each(failedCreateCases)('shows $name', async ({ answer, message }) => {
    server.use(http.post(apiEndpoints.projects.pattern, answer))
    const onCreated = renderForm()

    await create()

    await expectText(message)
    expect(routerMock.push).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it.each(failedSendCases)(
    'opens the project created, with a toast, when $request fails',
    async ({ path, reason }) => {
      const error = spyOnToast('error')
      server.use(http.post(path, () => serverError()))
      renderForm()

      await create()

      await expectPushedTo(activity)
      expect(error).toHaveBeenCalledWith('The project is created, but its idea was not sent.', {
        description: reason,
      })
    },
  )
})
