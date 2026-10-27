import { projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'
import { screenshots } from '../screenshot.utils'

// The pages that fail to render exist only while developing.
screenshots('App', (shot) => {
  shot.at('Page not found', '/no-such-page')

  shot('A screen outside a project that fails to render', async ({ page, user, shoot }) => {
    await page.goto('/render-error')

    await user.expectRole('heading', 'Something went wrong')
    await shoot()
  })

  shot('A screen of a project that fails to render', async ({ page, user, shoot }) => {
    await page.goto(`/projects/${projectIds.mentor}/render-error`)

    await user.expectRole('heading', 'Something went wrong')
    await shoot()
  })
})
