import { expect, type Page } from '@playwright/test'

type Text = string | RegExp

const IDEA_PROMPT = 'What product do you want to write the requirements for?'

/** Types an idea in the project list, creates the project, and gives its id once its activity opens. */
export async function startProject(page: Page, idea: string): Promise<string> {
  await page.goto('/projects')
  const create = page.getByRole('main').getByRole('button', { name: 'Create project' })
  // Text typed before the page has hydrated is lost, so the typing is repeated until the button
  // that the text enables is enabled.
  await expect(async () => {
    await page.getByRole('textbox', { name: IDEA_PROMPT }).fill(idea)
    await expect(create).toBeEnabled({ timeout: 1_000 })
  }).toPass()
  await create.click()
  await page
    .getByRole('dialog', { name: 'Create project' })
    .getByRole('button', { name: 'Create project' })
    .click()
  await expect(page).toHaveURL(/\/projects\/[^/]+\/activity$/)
  return /\/projects\/([^/]+)\/activity$/.exec(page.url())?.[1] ?? ''
}

/** Opens the activity of a project. */
export async function openActivity(page: Page, projectId: string) {
  await page.goto(`/projects/${projectId}/activity`)
}

/** Waits until the status bar of the project says this. */
export async function expectRunStatus(page: Page, status: Text) {
  await expect(page.getByRole('contentinfo')).toContainText(status)
}

/** Waits until a review asks this, in the chat. */
export async function expectReviewPrompt(page: Page, prompt: Text) {
  await expect(page.getByRole('status').filter({ hasText: prompt })).toBeVisible()
}

/** Picks an option of the review that waits. */
export async function chooseReviewOption(page: Page, label: string) {
  const option = page.getByRole('radio', { name: label })
  // A click before the page has hydrated picks nothing, so it is repeated until the option is picked.
  await expect(async () => {
    await option.click()
    await expect(option).toBeChecked({ timeout: 1_000 })
  }).toPass()
}

/** Sends the answer of the review that waits. */
export async function sendReview(page: Page) {
  await page.getByRole('button', { name: 'Send', exact: true }).click()
}

/** Picks an option of the review that waits and sends it. */
export async function answerReviewWith(page: Page, label: string) {
  await chooseReviewOption(page, label)
  await sendReview(page)
}

/** Stops the run from the status bar and confirms the question that follows. */
export async function stopRun(page: Page) {
  await page.getByRole('contentinfo').getByRole('button', { name: 'Stop' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Stop run' }).click()
}

/** Writes the feedback that an option of the review asks for. */
export async function fillReviewFeedback(page: Page, option: string, feedback: string) {
  await page.getByRole('textbox', { name: `Feedback for "${option}"` }).fill(feedback)
}

/** Types a message to the agents in the chat and sends it with the keyboard. */
export async function sendChatMessage(page: Page, message: string) {
  const box = page.getByRole('textbox', { name: 'Message to the agents' })
  await box.fill(message)
  await box.press('Enter')
}

/**
 * Opens a panel of the project from the bar at its side: Activity, Documents or Trace. A button of
 * the bar closes the panel that is open, so a panel that is open already is left as it is.
 */
export async function openSidePanel(page: Page, name: 'Activity' | 'Documents' | 'Trace') {
  // The bar is the group of buttons that tell whether they are pressed; a title of a panel with
  // the same name is not one of them.
  const button = page.getByRole('button', { name, exact: true }).and(page.locator('[aria-pressed]'))
  if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}

/** Opens a document or an item of the open panel, by the name it has there. */
export async function openTreeItem(page: Page, name: string | RegExp) {
  await page.getByRole('treeitem', { name }).first().click()
}

/** Opens the page of an item of the project. */
export async function openItem(page: Page, projectId: string, itemId: string) {
  await page.goto(`/projects/${projectId}/items/${itemId}`)
}

/** Opens the form that edits the item on screen. */
export async function startEditingItem(page: Page) {
  await page.getByRole('button', { name: 'More actions' }).first().click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
}

/** Writes a field of the form that edits an item. */
export async function fillItemField(page: Page, field: string, value: string) {
  await page.getByRole('textbox', { name: field }).fill(value)
}

/** Saves the form that edits an item. */
export async function saveItem(page: Page) {
  await page.getByRole('button', { name: 'Save' }).click()
}

/** Leaves the form that edits an item without saving, and confirms that the changes are lost. */
export async function discardItemEdit(page: Page) {
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Discard' }).click()
}
