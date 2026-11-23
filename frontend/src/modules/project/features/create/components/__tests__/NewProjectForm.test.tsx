import { screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { createdId, IdPrefix } from '@/mocks/shared/db'
import { keepAttachedSources, uploadSources, useAttachedSources } from '@/modules/source/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { recordRequests, serverError } from '@/test/msw'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectEnabled,
  expectFieldValue,
  expectNoRole,
  expectPushedTo,
  expectRole,
  expectText,
  pasteText,
  pressButton,
  pressRole,
  replaceText,
  spyOnToast,
} from '@/test/steps'

import { createProjectMessages } from '../../new-project.constants'
import { NewProjectForm } from '../NewProjectForm'
import { blankIdeas, createCases, failedCreateCases, failedSendCases } from './NewProjectForm.data'

// A file goes up as a multipart form, which a test of the browser cannot send, so the upload is a stand-in.
vi.mock('@/modules/source/entities', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  uploadSources: vi.fn(() => Promise.resolve<File[]>([])),
}))

const IDEA = 'Mentor platform for students.'
const projectId = createdId(IdPrefix.Project, 1)
const threadId = createdId(IdPrefix.Thread, 1)
const activity = `/projects/${projectId}/activity`

/** What stays chosen as sources, as the page that holds the choice shows it. */
function ChosenSources() {
  const { files } = useAttachedSources()
  return <p data-testid="chosen">{files.map(({ name }) => name).join(',')}</p>
}

function renderForm(onCreated = vi.fn(), sources: File[] = []) {
  keepAttachedSources(sources)
  renderWithProviders(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Create project</DialogTitle>
        <NewProjectForm idea={IDEA} defaultLanguage="vi" onCreated={onCreated} />
        <ChosenSources />
      </DialogContent>
    </Dialog>,
  )
  return onCreated
}

/** Replaces the text of a field with a paste, which takes an empty text too. */
async function replace(name: string, text: string) {
  await replaceText(screen.getByRole('textbox', { name }), '')
  await pasteText(text)
}

const create = () => pressButton('Create project')

/** The path and the body of each request of `method`, in the order the requests were sent. */
function sentWith(requests: ReturnType<typeof recordRequests>, method: HttpMethod) {
  return requests
    .filter((request) => request.method === method)
    .map(({ path, body }) => [path, body])
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

  it('uploads the sources to the project before it sends the idea, and says which of them did not go up', async () => {
    const error = spyOnToast('error')
    const notes = new File(['notes'], 'notes.md')
    const brief = new File(['brief'], 'brief.txt')
    vi.mocked(uploadSources).mockResolvedValueOnce([notes])
    const requests = recordRequests()
    renderForm(vi.fn(), [notes, brief])

    await create()

    await expectPushedTo(activity)
    expect(uploadSources).toHaveBeenCalledWith(projectId, [notes, brief])
    expect(error).toHaveBeenCalledWith(createProjectMessages.sourcesNotUploaded('notes.md'))
    // The file that went up is done with; the one that failed stays chosen, to be sent again.
    expect(screen.getByTestId('chosen')).toHaveTextContent('notes.md')
    expect(screen.getByTestId('chosen')).not.toHaveTextContent('brief.txt')
    expect(
      sentWith(requests, HttpMethod.Post).some(([path]) => String(path).endsWith('/messages')),
    ).toBe(true)
  })

  it('shows the settings of the runs once their section opens', async () => {
    renderForm()
    expectNoRole('spinbutton', 'Maximum steps')

    await pressButton('Agent settings')

    await expectRole('group', 'Agent settings')
    await expectRole('group', 'Reviews')
    expectEnabled('spinbutton', 'Maximum steps')
    expectEnabled('spinbutton', 'Cost limit (USD)')
    expect(
      await screen.findByRole('spinbutton', { name: 'Maximum turns per interviewee' }),
    ).toBeEnabled()
    expect(screen.getByRole('switch', { name: 'Default' })).toBeChecked()
  })

  it('saves the settings of the runs before it sends the idea', async () => {
    const requests = recordRequests()
    renderForm()

    await pressButton('Agent settings')
    await pressRole('spinbutton', 'Maximum steps')
    await pasteText('40')
    await create()

    await expectPushedTo(activity)
    expect(sentWith(requests, HttpMethod.Patch)).toEqual([
      [
        apiEndpoints.project.path({ projectId }),
        {
          run_config: {
            review_checkpoints: null,
            max_steps: 40,
            max_cost_usd: null,
            parameters: null,
          },
        },
      ],
    ])
    expect(sentWith(requests, HttpMethod.Post).at(-1)?.[0]).toBe(
      apiEndpoints.threadMessages.path({ threadId }),
    )
  })

  it('shows the problem of a setting at its field and creates nothing', async () => {
    renderForm()

    await pressButton('Agent settings')
    await pressRole('spinbutton', 'Cost limit (USD)')
    await pasteText('0')
    await create()

    await expectText('Enter an amount above 0.')
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('opens the project without its idea when the settings do not save', async () => {
    const error = spyOnToast('error')
    const requests = recordRequests()
    server.use(http.patch(apiEndpoints.project.pattern, () => serverError()))
    renderForm()

    await pressButton('Agent settings')
    await pressRole('spinbutton', 'Maximum steps')
    await pasteText('40')
    await create()

    await expectPushedTo(activity)
    expect(error).toHaveBeenCalledWith(createProjectMessages.settingsNotSaved, expect.anything())
    expect(requests.map(({ path }) => path)).not.toContain(
      apiEndpoints.threadMessages.path({ threadId }),
    )
  })

  it('keeps the files chosen as sources when the settings do not save, as none of them went up', async () => {
    const notes = new File(['notes'], 'notes.md')
    server.use(http.patch(apiEndpoints.project.pattern, () => serverError()))
    renderForm(vi.fn(), [notes])

    await pressButton('Agent settings')
    await pressRole('spinbutton', 'Maximum steps')
    await pasteText('40')
    await create()

    await expectPushedTo(activity)
    expect(uploadSources).not.toHaveBeenCalled()
    expect(screen.getByTestId('chosen')).toHaveTextContent('notes.md')
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
      const requests = recordRequests()
      const onCreated = renderForm()

      if (projectName !== null) await replace('Name (optional)', projectName)
      if (idea !== null) await replace('Idea', idea)
      await pressRole('combobox', 'Language of the documents')
      await pressRole('option', language)
      await create()

      await expectPushedTo(activity)
      expect(sentWith(requests, HttpMethod.Post)).toEqual(sent)
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
