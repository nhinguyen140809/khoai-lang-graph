import { expect, test } from '@playwright/test'

import { PROJECT_IDS, THREAD_IDS } from '../../src/mocks/mock-ids.constants'

const session = `/projects/${PROJECT_IDS.mentor}/session`
const campusSession = `/projects/${PROJECT_IDS.campus}/session`

test('starts a run with a message and follows its events', async ({ page }) => {
  await page.goto(campusSession)

  await page.getByRole('combobox', { name: 'Message' }).fill('Add a report of the orders')
  await page.keyboard.press('Enter')

  // The message prints as an event, the run starts, its steps print as they start, and the run
  // ends with its own event.
  const log = page.getByRole('log', { name: 'Event log' })
  await expect(log.getByText('Add a report of the orders')).toBeVisible()
  await expect(log.getByText('Run 2 started')).toBeVisible()
  await expect(log.getByText('planner').last()).toBeVisible()
  await expect(log.getByText('persona_generator').last()).toBeVisible()
  await expect(log.getByText('Run 2 done')).toBeVisible({ timeout: 15_000 })
})

test('does not send a message while a run waits for its review', async ({ page }) => {
  await page.goto(session)
  const log = page.getByRole('log', { name: 'Event log' })
  await expect(log.getByText(/Requirements analysis v4 waits for your review/)).toBeVisible()

  await page.getByRole('combobox', { name: 'Message' }).fill('Also check the refund rules')
  await page.keyboard.press('Enter')

  await expect(page.getByText(/A run is in progress\. Use a command/)).toBeVisible()
  await expect(log.getByText('Also check the refund rules')).toBeHidden()
})

test('stops the run with Esc pressed twice', async ({ page }) => {
  await page.goto(session)
  const input = page.getByRole('combobox', { name: 'Message' })
  await expect(page.getByText('esc stop run')).toBeVisible()

  await input.press('Escape')
  await expect(page.getByText('press esc again to stop the run')).toBeVisible()
  await input.press('Escape')

  await expect(page.getByText(/Run 3 stopped/)).toBeVisible()
  await expect(page.getByText('esc stop run')).toBeHidden()
})

test('stops the run with a command', async ({ page }) => {
  await page.goto(session)
  const input = page.getByRole('combobox', { name: 'Message' })

  await input.fill('/')
  await expect(page.getByRole('option', { name: /\/retry/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await page.getByRole('option', { name: /\/stop/ }).click()

  await expect(page.getByText(/Run 3 stopped/)).toBeVisible()
  // The command is an event of the log and an entry of the outline.
  await expect(page.getByRole('log', { name: 'Event log' }).getByText('/stop')).toBeVisible()
  await expect(
    page.getByRole('complementary', { name: 'Session' }).getByRole('button', { name: /\/stop/ }),
  ).toBeVisible()
})

test('goes to a message of the user from the outline', async ({ page }) => {
  // A short window, so that the log is longer than what it shows.
  await page.setViewportSize({ width: 1280, height: 420 })
  await page.goto(session)
  const log = page.getByRole('log', { name: 'Event log' })
  await expect(log.getByText(/Requirements analysis v4 waits for your review/)).toBeVisible()
  // The log follows its newest row, so the first message is out of view.
  await expect(log.getByText(/online platform for university students/)).not.toBeInViewport()

  await page
    .getByRole('complementary', { name: 'Session' })
    .getByRole('button', { name: /online platform/ })
    .click()

  await expect(log.getByText(/online platform for university students/)).toBeInViewport()
})

test('lists the sessions of the project in the second view', async ({ page }) => {
  await page.goto(session)
  const panel = page.getByRole('complementary', { name: 'Session' })

  await panel.getByRole('tab', { name: 'Sessions' }).click()
  const main = panel.getByRole('link', { name: /Main thread/ })
  await expect(main).toHaveAttribute('href', `${session}/${THREAD_IDS.mentorMain}`)
  await main.click()

  await expect(page).toHaveURL(new RegExp(`${THREAD_IDS.mentorMain}$`), { timeout: 15_000 })
  await expect(
    page.getByRole('log', { name: 'Event log' }).getByText(/Requirements analysis v4 waits/),
  ).toBeVisible()
})

test('mentions an item in the message that starts a run', async ({ page }) => {
  await page.goto(campusSession)
  const input = page.getByRole('combobox', { name: 'Message' })

  await input.fill('see @REQ-001')
  await page.getByRole('option', { name: /REQ-001/ }).click()

  await expect(input).toHaveValue('see @REQ-001 ')
})

test('shows an error with a retry when the session fails to open', async ({ page }) => {
  await page.goto(`${session}?mock-threads=error`)

  // Next.js adds its own empty role="alert" element (the route announcer), so match by text.
  // The outline in the side panel fails the same way, so the first alert is the one of the page.
  const alert = page.getByRole('alert').filter({ hasText: 'Failed to open the session' }).first()
  await expect(alert).toBeVisible()
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('opens an empty session when the project has no thread', async ({ page }) => {
  await page.goto(`${session}?mock-threads=empty`)

  await expect(page.getByRole('combobox', { name: 'Message' })).toBeVisible()
  await expect(page.getByPlaceholder(/Describe what to build/)).toBeVisible()
})

test('switches the theme from the account menu', async ({ page }) => {
  await page.goto(session)

  await page.getByRole('button', { name: /Account/ }).click()
  await page.getByRole('menuitemradio', { name: 'Light' }).click()

  await expect(page.locator('html')).not.toHaveClass(/dark/)
})
