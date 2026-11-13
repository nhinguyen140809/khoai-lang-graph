import { expect } from '@playwright/test'

import { IdPrefix, projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'
import { mockId } from '../../../src/mocks/shared/db/mock-ids.utils'
import { screenshots } from '../screenshot.utils'

const project = `/projects/${projectIds.mentor}`
const libraryProject = `/projects/${projectIds.library}`
const campusProject = `/projects/${projectIds.campus}`

screenshots('Activity', (shot) => {
  shot.at('Waiting for a review', `${project}/activity`, { fullPage: true })
  shot.at('Working', `${project}/activity?mock-run-status=running`)
  shot.at('Failed', `${project}/activity?mock-run-status=failed`)
  shot.at('Finished', `${project}/activity?mock-run-status=done`)
  shot.at('Project with no run', `${libraryProject}/activity?mock-threads=empty`)
  shot.at('Interviews in progress', `${libraryProject}/activity`, { fullPage: true })
  shot.at('Message that no run took in', `${campusProject}/activity`, { fullPage: true })

  shot.at('Threads loading', `${project}/activity?mock-threads=loading`)
  shot.at('Threads failing', `${project}/activity?mock-threads=error`)
  shot.at('Messages loading', `${project}/activity?mock-messages=loading`)
  shot.at('Messages failing', `${project}/activity?mock-messages=error`)
  shot.at('Steps loading', `${project}/activity?mock-runs=loading`)
  shot.at('Steps failing', `${project}/activity?mock-runs=error`)
  shot.at('Interrupts failing', `${project}/activity?mock-interrupts=error`)

  shot('Review with questions only', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-agent-questions=only`)

    await user.expectText(
      'Before I plan the interviews, tell me who will use the platform and what the first version must take care of.',
    )
    await shoot()
  })

  shot('Review with feedback', async ({ page, shoot }) => {
    await page.goto(`${project}/activity`)

    await page.getByRole('radio', { name: 'Redo the analysis' }).click()
    await page
      .getByRole('textbox', { name: 'Feedback for "Redo the analysis"' })
      .fill('Ask the student and the admin whether a layered design works.')
    await shoot()
  })

  shot('Review with suggested feedback', async ({ page, shoot }) => {
    await page.goto(`${project}/activity`)

    // The agent suggests what to say for the option, so the box is filled before the user writes.
    await page.getByRole('radio', { name: 'Redo the analysis' }).click()
    await expect(
      page.getByRole('textbox', { name: 'Feedback for "Redo the analysis"' }),
    ).not.toHaveValue('')
    await shoot()
  })

  shot('Message under the pointer', async ({ page, shoot }) => {
    await page.goto(`${project}/activity`)

    // The copy of the words of a message stays hidden until the pointer reads over it.
    const message = page.getByText('I read all three interviews', { exact: false })
    await message.waitFor()
    await shoot({ hover: message })
  })

  shot('Review answered', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity`)

    await user.pressButton('Send')
    const answered = page.getByText('Answered: Approve analysis')
    await answered.waitFor()
    await answered.scrollIntoViewIfNeeded()
    await shoot()
  })

  shot('Review rejected', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity`)

    await page.getByRole('radio', { name: 'Redo the analysis' }).click()
    await page
      .getByRole('textbox', { name: 'Feedback for "Redo the analysis"' })
      .fill('Ask the student and the admin whether a layered design works.')
    await user.pressButton('Send')
    const answered = page.getByText('Answered: Redo the analysis')
    await answered.waitFor()
    await answered.scrollIntoViewIfNeeded()
    await shoot()
  })

  shot('Chat scrolled up', async ({ page, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=running`)

    // The chat starts at its end; scrolled away from it, the button back to it shows.
    await page.locator('[data-slot="message-scroller-viewport"]').hover()
    await page.mouse.wheel(0, -600)
    await shoot()
  })

  // The note under a message of the user that the agents have not read yet, one per state of
  // its run. The chat does not sit at its end on its own, so each note scrolls into view first.
  shot('Delivery note: read after the step', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=running`)

    const note = page.getByText('Will be read after the current step.')
    await note.scrollIntoViewIfNeeded()
    await user.expectText('Will be read after the current step.')
    await shoot()
  })

  shot('Delivery note: read after the review', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity`)

    const note = page.getByText('Will be read after you answer the review.')
    await note.scrollIntoViewIfNeeded()
    await user.expectText('Will be read after you answer the review.')
    await shoot()
  })

  shot('Delivery note: not read', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=done`)

    const note = page.getByText('Not read: the work ended before this message.')
    await note.scrollIntoViewIfNeeded()
    await user.expectText('Not read: the work ended before this message.')
    // The pointer rests on the message, so its send-again reads next to its copy.
    await shoot({ hover: note })
  })

  shot('Writes of the work open', async ({ page, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=done`)

    // Several lines of work wrote; the first one opens to show what it wrote.
    const writes = page.getByRole('button', { name: 'Show what it wrote' }).first()
    await writes.click()
    await expect(writes).toHaveAttribute('aria-expanded', 'true')
    await shoot({ fullPage: true })
  })

  shot('Answering is pending', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=waiting&mock-resume-run=loading`)

    await user.pressButton('Send')
    await user.expectLabel('Sending the answer')
    await shoot()
  })

  shot('Answering fails', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=waiting&mock-resume-run=error`)

    await user.pressButton('Send')
    await user.expectText(/The answer was not sent\./)
    await shoot()
  })

  shot('Sending is pending', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=waiting&mock-send-message=loading`)

    await user.fillTextbox('Message to the agents', 'Also ask about group sessions.')
    // The review that waits carries a send of its own; this one sends the message.
    const send = page
      .getByRole('form', { name: 'Message to the agents' })
      .getByRole('button', { name: 'Send' })
    await send.click()
    await expect(send).toBeDisabled()
    await shoot()
  })

  shot('Sending fails', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=waiting&mock-send-message=error`)

    await user.fillTextbox('Message to the agents', 'Also ask about group sessions.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await user.expectText(/The message was not sent\./)
    await shoot()
  })

  shot('Stopped', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=running`)

    await user.pressButton('Stop', page.getByRole('contentinfo'))
    await user.expectRole('alertdialog', 'Stop the run?')
    await user.pressButton('Stop run', page.getByRole('alertdialog'))
    await page.getByText('Stopped').first().waitFor()
    await shoot({ fullPage: true })
  })

  shot('Progress collapsed', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity`)

    await user.pressButton('Progress')
    await shoot()
  })

  shot('Outline collapsed', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity`)

    await user.pressButton('Outline')
    await shoot()
  })

  shot('Run settings dialog', async ({ page, user, shoot }) => {
    await page.goto(`${project}/activity?mock-run-status=done`)

    await user.pressButton('Run settings')
    await page.getByRole('dialog').waitFor()
    await shoot()
  })

  shot('Target entry', async ({ page, shoot }) => {
    await page.goto(`${project}/activity?entry=${mockId(IdPrefix.Message, 9)}`)

    await page.locator('[data-target="true"]').waitFor()
    await shoot()
  })
})
