import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import type { ToolUse } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { renderWithProviders } from '@/test/render'
import { expectNoText, expectText, pressRole } from '@/test/steps'

import { activityChatMessages } from '../../activity-chat.constants'
import { RunActivityProvider } from '../RunActivityContext'
import { ToolUseEntryView } from '../ToolUseEntryView'

const run = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 1,
  workflow_version: workflowDefinitionFixture.version,
})

const at = '2026-10-06T10:00:00Z'

function useOf(isRunning: boolean): ToolUse {
  return {
    id: 's1~tool1',
    tool: 'search',
    startedAt: at,
    isRunning,
    notes: [
      { kind: 'tool', tool: 'search', text: 'Checking how students talk.', created_at: at },
      { kind: 'tool', tool: 'search', text: 'Looking at librarian forums.', created_at: at },
    ],
  }
}

function renderUse(use: ToolUse) {
  return renderWithProviders(
    <RunActivityProvider value={{ run, thread: null, projectId: projectIds.mentor }}>
      <ToolUseEntryView use={use} />
    </RunActivityProvider>,
  )
}

/** Serves the definition with the search tool, which version 1 of the docs does not list. */
function serveSearchTool() {
  server.use(
    http.get(apiEndpoints.workflowDefinition.pattern, () =>
      HttpResponse.json({
        ...workflowDefinitionFixture,
        tools: [
          {
            key: 'search',
            title: 'Web search',
            description: 'Searches the web.',
            uses: { one: 'Searched once', other: 'Searched {count} times' },
            icon: 'search',
          },
        ],
      }),
    ),
  )
}

describe('ToolUseEntryView', () => {
  it('says how many times the tool was used in the words of the definition, closed once the use is over', async () => {
    serveSearchTool()
    renderUse(useOf(false))

    await expectText('Searched 2 times')
    expectNoText('Checking how students talk.')
  })

  it('opens to the note of each use', async () => {
    serveSearchTool()
    renderUse(useOf(false))
    await screen.findByText('Searched 2 times')

    await pressRole('button', activityChatMessages.showDetails)

    await expectText('Checking how students talk.')
    await expectText('Looking at librarian forums.')
  })

  it('is open while the tool is in use', async () => {
    serveSearchTool()
    renderUse(useOf(true))

    await expectText('Looking at librarian forums.')
  })

  it('names a tool that the definition does not list in plain words', async () => {
    renderUse(useOf(false))

    await expectText('Looked up with search, 2 times')
  })
})
