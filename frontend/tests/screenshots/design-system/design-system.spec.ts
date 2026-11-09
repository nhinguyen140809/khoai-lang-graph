import { expect, type Page } from '@playwright/test'

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

  shot('Copy buttons', async ({ page, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    await shoot({ part: copyCard(page) })
  })

  shot('Copy buttons that copied', async ({ page, user, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')
    // The browser gives the page its clipboard, which a headless one refuses without this.
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await user.pressButton('Copy the key')
    await user.pressButton('Copy the version')
    await user.pressButton('Copy the run id')
    await user.pressButton('Copy the value')
    // The two buttons that show words turn them, and the state must hold past the shot below.
    await expect(page.getByRole('button', { name: 'Copied' })).toHaveCount(2)

    await shoot({ part: copyCard(page) })

    await expect(page.getByRole('button', { name: 'Copied' })).toHaveCount(2)
  })

  shot('Copy button tooltip', async ({ page, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    // The last sample of the card sits at its bottom, so the tooltip opens inside the card.
    await shoot({
      part: copyCard(page),
      hover: page.getByRole('button', { name: 'Copy the value' }),
    })
    // The tooltip was open while the shot was taken.
    await expect(page.getByRole('tooltip')).toBeVisible()
  })

  shot('Floating surfaces', async ({ page, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    await shoot({
      part: page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', { hasText: 'Floating surface' }),
      }),
    })
  })

  shot('Key text and relative time', async ({ page, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    await shoot({
      part: page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', { hasText: 'Typography' }),
      }),
    })
  })

  shot('Trace graph', async ({ page, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    // Every line style, weight and color of an edge with its arrowhead, and every fill and color
    // of a node, in one card.
    await shoot({
      part: page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', { hasText: 'Trace graph' }),
      }),
    })
  })

  shot('Document diff', async ({ page, shoot }) => {
    const width = page.viewportSize()?.width ?? 1920
    await page.setViewportSize({ width, height: 2400 })
    await page.goto('/design-system')

    await shoot({
      part: page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', { hasText: 'Diff view' }),
      }),
    })
  })
})

/** The card of the copy buttons on the page. */
function copyCard(page: Page) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: 'Copy button' }) })
}
