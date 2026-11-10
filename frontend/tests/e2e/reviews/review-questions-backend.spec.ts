import { expect } from '@playwright/test'

import { expectProblem } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { analysisReview, idea, personasReview } from './review-questions-backend.data'

test('words the review for the case and asks a question that has its own default', async ({
  api,
}) => {
  const { run } = await api.startRun(idea, { reviews: [personasReview.node] })

  const review = await api.waitForReview(run.id)

  expect(review.prompt).toBe(personasReview.prompt)
  const [question] = review.questions
  expect(review.questions).toHaveLength(1)
  expect(question).toMatchObject({
    source: 'agent',
    key: personasReview.question.key,
    prompt: personasReview.question.prompt,
    required: false,
  })
  expect(question?.choices.map(({ key }) => key)).toEqual(personasReview.question.choices)
  expect(question?.default_answer?.choice_keys).toEqual([personasReview.question.defaultChoice])
})

test('goes on when the question is left alone, and refuses something else without a word', async ({
  api,
}) => {
  const { run } = await api.startRun(idea, { reviews: [personasReview.node] })
  const review = await api.waitForReview(run.id)

  expectProblem(
    await api.answerReview(review, {
      option: 'approve',
      answers: { focus: { choice_keys: ['other'], text: null, number: null } },
    }),
    422,
    'validation_failed',
    'answers.focus',
  )
  expect((await api.getRun(run.id)).status).toBe('interrupted')

  await api.resumeRun(review, { option: 'approve' })

  const finished = await api.waitForRun(run.id, ['succeeded'])
  expect(finished.error).toBeNull()
})

test('suggests what to say for an option that asks for feedback, and for no other', async ({
  api,
}) => {
  const { run } = await api.startRun(idea, { reviews: [analysisReview.node] })

  const review = await api.waitForReview(run.id)

  expect(review.prompt).toBe(analysisReview.prompt)
  const suggestions = Object.fromEntries(
    review.options.map(({ key, suggested_feedback }) => [key, suggested_feedback ?? null]),
  )
  expect(suggestions[analysisReview.optionKey]).toBe(analysisReview.suggestion)
  expect(suggestions.accept).toBeNull()
})

test('shows the question before the options, and goes on with its default when it is left alone', async ({
  api,
  page,
  user,
}) => {
  const { projectId, run } = await api.startRun(idea, { reviews: [personasReview.node] })
  await api.waitForReview(run.id)
  await user.openActivity(projectId)

  await user.expectReviewPrompt(personasReview.prompt)
  await user.expectText(personasReview.question.prompt)
  await page.getByRole('button', { name: 'Next step' }).click()
  await user.sendReview()

  const finished = await api.waitForRun(run.id, ['succeeded'])
  expect(finished.error).toBeNull()
})

test('fills the feedback with the suggestion of the option, which the user may rewrite', async ({
  api,
  page,
  user,
}) => {
  const { projectId, run } = await api.startRun(idea, { reviews: [analysisReview.node] })
  await api.waitForReview(run.id)
  await user.openActivity(projectId)

  await user.chooseReviewOption(analysisReview.option)

  const box = page.getByRole('textbox', { name: `Feedback for "${analysisReview.option}"` })
  await expect(box).toHaveValue(analysisReview.suggestion)

  await user.fillReviewFeedback(analysisReview.option, 'Ask the librarian too.')
  await user.chooseReviewOption(analysisReview.otherOption)
  await user.chooseReviewOption(analysisReview.option)
  await expect(box).toHaveValue('Ask the librarian too.')
})

test('offers something else next to the options: it needs words, and the words go on as a message', async ({
  api,
  client,
}) => {
  const { run, threadId } = await api.startRun(idea, { reviews: [analysisReview.node] })
  const review = await api.waitForReview(run.id)

  const other = review.options.find(({ key }) => key === analysisReview.somethingElse.key)
  expect(other).toMatchObject({
    label: analysisReview.somethingElse.label,
    requires_feedback: true,
    approves: false,
  })
  expect(other?.suggested_feedback).toBeUndefined()
  expectProblem(
    await api.answerReview(review, { option: analysisReview.somethingElse.key }),
    422,
    'validation_failed',
    'feedback',
  )

  await api.resumeRun(review, {
    option: analysisReview.somethingElse.key,
    feedback: analysisReview.somethingElse.words,
  })

  await expect
    .poll(async () => (await api.listSteps(run.id)).some(({ node }) => node === 'intent_router'))
    .toBe(true)
  const messages = await client.get<{ items: { author: string; content: string }[] }>(
    `/threads/${threadId}/messages`,
  )
  const said = messages.body.items
    .filter(({ content }) => content === analysisReview.somethingElse.words)
    .map(({ author, content }) => ({ author, content }))
  expect(said).toEqual([{ author: 'user', content: analysisReview.somethingElse.words }])
})

test('says under each option what choosing it does, and opens an empty box for something else', async ({
  api,
  page,
  user,
}) => {
  const { projectId, run } = await api.startRun(idea, { reviews: [analysisReview.node] })
  await api.waitForReview(run.id)
  await user.openActivity(projectId)

  await user.expectText(analysisReview.descriptions.accept)
  await user.expectText(analysisReview.descriptions.reject_reanalyse)

  await user.chooseReviewOption(analysisReview.somethingElse.label)
  await expect(
    page.getByRole('textbox', { name: `Feedback for "${analysisReview.somethingElse.label}"` }),
  ).toHaveValue('')
})
