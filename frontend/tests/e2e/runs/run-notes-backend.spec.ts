import { expect } from '@playwright/test'

import { test } from '../../shared/fixtures.utils'
import { idea, interviewReport, plannerNotes } from './run-notes-backend.data'

test('keeps the notes that a step wrote while it worked, in the order written', async ({ api }) => {
  const { run } = await api.startFinishedRun(idea)

  const steps = await api.listSteps(run.id)

  const planner = steps.find(({ node }) => node === 'planner')
  expect(planner?.notes.map(({ kind, text }) => ({ kind, text }))).toEqual(plannerNotes)
  // A note of a tool names the tool, and every other note names none.
  const searches = steps.find(({ node }) => node === 'corpus_builder')?.notes ?? []
  expect(searches.filter(({ kind }) => kind === 'tool').map(({ tool }) => tool)).toEqual([
    'search',
    'search',
  ])
  expect(planner?.notes.every(({ tool }) => tool === null)).toBe(true)
})

test('shows the notes of finished work behind its line, as Markdown, once the line is opened', async ({
  api,
  page,
  user,
}) => {
  const { projectId } = await api.startFinishedRun(idea)
  await user.openActivity(projectId)

  const [doing] = plannerNotes
  const line = page.getByRole('button', { name: 'Show what it noted and wrote' }).first()
  await expect(line).toBeVisible()
  // Finished work is closed: what it noted is behind the line.
  await expect(page.getByText(doing?.text ?? '')).toBeHidden()

  await line.click()

  await expect(page.getByText(doing?.text ?? '')).toBeVisible()
  await expect(page.getByText('The idea does not say who')).toBeVisible()
  // The text between ** is bold, shown without its marks.
  await expect(page.getByText('approves', { exact: true })).toBeVisible()
  await expect(page.getByText('**approves**')).toBeHidden()
})

test('tells the user what each interview showed, in the chat, when the interviewer stops', async ({
  api,
  client,
  page,
  user,
}) => {
  const { projectId, threadId } = await api.startFinishedRun(idea)

  const messages = await client.get<{
    items: { author: string; agent_role: string | null; content: string }[]
  }>(`/threads/${threadId}/messages`)

  const reports = messages.body.items.filter(({ agent_role }) => agent_role === 'interviewer')
  expect(reports.length).toBeGreaterThan(0)
  expect(
    reports.every(({ author, content }) => author === 'agent' && content === interviewReport),
  ).toBe(true)
  await user.openActivity(projectId)
  await expect(page.getByText(interviewReport).first()).toBeVisible()
})
