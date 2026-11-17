import { projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'
import { userViewUrl } from '../../shared/backend-env.constants'
import { test } from '../../shared/fixtures.utils'

// The specs of the user view name its host; the other specs run at the host of the developer view.

test('opens a project in the frame of the chat at the host of the user view', async ({
  page,
  user,
}) => {
  await page.goto(`${userViewUrl}/`)

  await user.expectRole('heading', 'What product do you want to write the requirements for?')
  await user.pressLink('Mentor platform, Waiting for you')

  await user.expectUrl(`${userViewUrl}/projects/${projectIds.mentor}`)
  await user.expectRole('textbox', 'Message to the agents')
  await user.expectNoRole('tab', 'Activity')
})
