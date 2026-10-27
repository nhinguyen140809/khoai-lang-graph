import { screenshots } from '../screenshot.utils'

screenshots('Design system', (shot) => {
  shot.at('Components in both themes', '/design-system', { fullPage: true })

  shot('Number inputs', async ({ page, shoot }) => {
    // The cards scroll in a panel as high as the window, so the window is made high enough to hold
    // the whole card, which a screenshot of an element cannot take across a scroll.
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    await shoot({
      part: page
        .locator('[data-slot="card"]')
        .filter({ has: page.locator('[data-slot="card-title"]', { hasText: 'Number inputs' }) }),
    })
  })
})
