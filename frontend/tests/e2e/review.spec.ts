import { expect, test } from '@playwright/test'

import { PROJECT_IDS, RUN_IDS } from '../../src/mocks/shared/mock-ids.constants'

const consolePath = `/projects/${PROJECT_IDS.mentor}/console`
const reviewPath = `/projects/${PROJECT_IDS.mentor}/review/${RUN_IDS.mentorMain3}`

test('opens the review from the console, with the artifact beside the event log', async ({
  page,
}) => {
  await page.goto(consolePath)

  await page.getByRole('link', { name: 'Open the review' }).click()

  await expect(page).toHaveURL(new RegExp(`/review/${RUN_IDS.mentorMain3}$`), { timeout: 20_000 })
  await expect(page.getByRole('tab', { name: 'Requirements analysis v4' })).toBeVisible()
  const edited = page.getByTitle('Edited by you')
  await expect(edited).toBeVisible()
  await expect(edited.locator('..')).toContainText('AR-007')
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).toContainText('Under review: Requirements analysis v4')
  await expect(review).toContainText('Edited by you: AR-007 v2')
  await expect(page.getByRole('log', { name: 'Event log' })).toBeVisible()
})

test('chooses an option, gives the feedback and sends the answer, and the run goes on', async ({
  page,
}) => {
  await page.goto(reviewPath)
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).toBeVisible({ timeout: 20_000 })

  await review.getByRole('radio', { name: /3\. Reject and re-interview/ }).click()
  await review.getByRole('button', { name: 'Send' }).click()
  await expect(review.getByText('Write the feedback.')).toBeVisible()
  await review.getByRole('textbox').fill('Ask the admin and the student again.')
  await review.getByRole('button', { name: 'Send' }).click()

  await expect(page).toHaveURL(new RegExp(`${consolePath}$`), { timeout: 20_000 })
  await expect(page.getByRole('link', { name: /Run 3: running/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open the review' })).toBeHidden()
})

test('accepts the analysis with Enter, which approves the artifact', async ({ page }) => {
  await page.goto(reviewPath)
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).toBeVisible({ timeout: 20_000 })

  await review.getByRole('radio', { name: /1\. Accept/ }).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(new RegExp(`${consolePath}$`), { timeout: 20_000 })
  await page.goto(`/projects/${PROJECT_IDS.mentor}/artifacts`)
  // The side panel stays the one shown with the review, the console, until another is chosen.
  await page
    .getByRole('navigation', { name: 'Features' })
    .getByRole('button', { name: 'Artifacts' })
    .click()
  await expect(
    page
      .getByRole('complementary', { name: 'Artifacts' })
      .getByRole('link', { name: /Requirements analysis/ }),
  ).toBeVisible()
})

test('leaves the review for later with Esc', async ({ page }) => {
  await page.goto(reviewPath)
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).toBeVisible({ timeout: 20_000 })

  await review.getByRole('radio', { name: /1\. Accept/ }).focus()
  await page.keyboard.press('Escape')

  await expect(page).toHaveURL(new RegExp(`${consolePath}$`), { timeout: 20_000 })
  await expect(page.getByRole('link', { name: 'Open the review' })).toBeVisible()
})

test('answers the questions of a checkpoint', async ({ page }) => {
  await page.goto(`${reviewPath}?mock-review=questions`)
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).toBeVisible({ timeout: 20_000 })

  await expect(
    review.getByRole('group', { name: 'Who will use the platform? (choose any)' }),
  ).toBeVisible()
  await review.getByRole('checkbox', { name: /Students/ }).click()
  await review.getByRole('checkbox', { name: /Mentors/ }).click()
  await review.getByRole('button', { name: 'Send' }).click()
  await expect(review.getByText('Choose at least one.')).toBeVisible()

  await review.getByRole('checkbox', { name: /Mentors/ }).click()
  await review.getByRole('button', { name: 'Send' }).click()

  await expect(page).toHaveURL(new RegExp(consolePath), { timeout: 20_000 })
})

test('says when the run waits for no review', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/review/${RUN_IDS.mentorMain1}`)

  await expect(page.getByText('This run waits for no review')).toBeVisible({ timeout: 20_000 })
})

test('opens the review by itself when a run stops at a checkpoint', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_IDS.campus}/console?mock-play=review`)

  await page.getByRole('combobox', { name: 'Message' }).fill('Add a report of the orders')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/review\//, { timeout: 30_000 })
  const review = page.getByRole('region', { name: 'Review' })
  await expect(review).toContainText('Review the personas')
  await expect(page.getByRole('tab', { name: /Persona catalog/ })).toBeVisible()
  await review.getByRole('button', { name: 'Send' }).click()
  await expect(page).toHaveURL(/\/console$/, { timeout: 20_000 })
})
