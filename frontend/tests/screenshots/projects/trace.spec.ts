import { expect } from '@playwright/test'

import { itemFixtureByKey } from '../../../src/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'
import { screenshots } from '../screenshot.utils'

const project = `/projects/${projectIds.mentor}`
const chainItem = itemFixtureByKey(projectIds.mentor, 'AR-003')
const chainItemTitle = String(chainItem.content.title)
const chain = `${project}/trace/items/${chainItem.id}`
const outOfDateItem = itemFixtureByKey(projectIds.mentor, 'AR-007')
const outOfDateTitle = String(outOfDateItem.content.title)
const noLinkItem = itemFixtureByKey(projectIds.mentor, 'ASM-001')
const noLinkTitle = String(noLinkItem.content.title)

// The item whose document takes changes, whose menu can open the Add link dialog.
const analysisItem = itemFixtureByKey(projectIds.mentor, 'AR-003')

screenshots('Trace', (shot) => {
  /** Takes the whole workspace: the side panel with the page. */
  shot('the start page with the panel', async ({ page, shoot }) => {
    await page.goto(`${project}/trace`)

    await shoot({ fullPage: false })
  })

  shot('the chain of an item', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()

    await shoot()
  })

  shot('the chain with a link chosen', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()
    // The canvas measures its nodes and fits them after it first draws, so it settles first. The
    // menu of a link opens from its label, and the words it quotes choose it; on a phone the side
    // panel covers part of the canvas, so the first label free to click is chosen.
    await page.waitForTimeout(2500)
    const labels = page.locator('[data-slot="flow"] [data-slot="dropdown-menu-trigger"]')
    for (let index = 0; index < (await labels.count()); index += 1) {
      try {
        await labels.nth(index).click({ timeout: 2000 })
        break
      } catch {
        // This label sits under the panel or off the canvas; the next one may be free.
      }
    }
    await page.getByRole('menuitem', { name: 'Show quotes' }).click()
    // The title of the chosen link takes the solid fill of its color, and the words it quotes show
    // in the strip below the graph.
    await expect(page.locator('[data-slot="flow"] button[data-selected]')).toBeVisible()

    await shoot()
  })

  shot('the chain with a link chosen whose two ends are quoted', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()
    await page.waitForTimeout(2500)
    // The two links that are out of date carry the sign of an old version in their title. The one
    // of the requirement quotes words at both ends, each held by the statement of its item: the
    // strip under the graph shows one card for each end, with the words marked in the statement,
    // under the title, and not in the title.
    const outOfDate = page.locator('[data-slot="flow"] [data-slot="dropdown-menu-trigger"]', {
      has: page.locator('svg'),
    })
    await outOfDate.nth(1).click()
    await page.getByRole('menuitem', { name: 'Show quotes' }).click()
    const strip = page.locator('[data-slot="alert"]').nth(1)
    await expect(strip).toContainText('filter mentors by field of study')
    await expect(strip).toContainText('searches mentors by field')
    await expect(strip.locator('[data-slot="quote-excerpt"]')).toHaveCount(2)
    // The title of the chosen link takes its solid fill once its transition is over.
    await expect(page.locator('[data-slot="flow"] button[data-selected]')).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    )

    await shoot()
  })

  shot('the title of a link with the focus', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()
    // The canvas measures its nodes and fits them after it first draws, so it settles first.
    await page.waitForTimeout(2500)
    const label = page.locator('[data-slot="flow"] [data-slot="dropdown-menu-trigger"]').first()
    // At rest the title has no fill and no border.
    await expect(label).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(label).toHaveCSS('border-top-width', '0px')

    await label.focus()
    // With the focus it takes a solid fill, and still draws no border and no outline.
    await expect(label).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(label).toHaveCSS('border-top-width', '0px')
    await expect(label).toHaveCSS('outline-style', 'none')

    await shoot({ part: page.locator('[data-slot="flow"]') })
  })

  shot('a node menu open', async ({ page, shoot }) => {
    await page.goto(chain)
    // The "..." button of the node of the item of the page, on the canvas alone: the item page
    // of Documents carries a "More actions" button of its own.
    const more = page
      .locator('[data-slot="flow"]')
      .getByRole('button', { name: `More actions for ${chainItemTitle}` })
      .first()
    await more.waitFor()
    await more.click()

    await shoot()
  })

  shot('the open issues', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/issues`)
    await page.getByRole('heading', { level: 1, name: 'Open issues' }).waitFor()

    await shoot()
  })

  shot('the open issues with the page of an issue kept beside them', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/issues`)
    await page.getByRole('heading', { level: 1, name: 'Open issues' }).waitFor()

    await page.getByRole('button', { name: 'Open in a new tab' }).first().click()

    // The page of the issue opens in a tab of its own that stays, so the list keeps its tab.
    const tabs = page.getByRole('navigation', { name: 'Open editors' })
    await expect(tabs.getByRole('link', { name: /2 seconds/ })).toBeVisible()
    await expect(tabs.getByRole('link', { name: /Open issues/ })).toBeVisible()

    await shoot()
  })

  shot('a gap', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/gaps/needs_review`)
    await page.getByRole('heading', { level: 1, name: 'Links to check' }).waitFor()

    await shoot()
  })

  shot('a gap of the user stories', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/gaps/no_backlog_item`)
    await page
      .getByRole('heading', { level: 1, name: 'Requirements without a user story' })
      .waitFor()

    await shoot()
  })

  shot('a gap of the sources', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/gaps/no_source`)
    await page.getByRole('heading', { level: 1, name: 'Requirements without a source' }).waitFor()

    await shoot()
  })

  shot('a list that the coverage does not list', async ({ page, shoot }) => {
    // The page opens as any gap does, named after its key, with its list empty.
    await page.goto(`${project}/trace/gaps/no_such_gap`)
    await page.getByTestId('side-editor').getByText('This list is empty.').waitFor()

    await shoot()
  })

  shot('a gap that failed to load', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/gaps/needs_review?mock-traceability=error`)
    await page.getByTestId('side-editor').getByText('The items could not load.').waitFor()

    await shoot()
  })

  shot('a link menu open', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()
    // The canvas measures its nodes and fits them after it first draws, so it settles first; on a
    // phone the side panel covers part of the canvas, so the first label free to click is chosen.
    await page.waitForTimeout(2500)
    const labels = page.locator('[data-slot="flow"] [data-slot="dropdown-menu-trigger"]')
    for (let index = 0; index < (await labels.count()); index += 1) {
      try {
        await labels.nth(index).click({ timeout: 2000 })
        break
      } catch {
        // This label sits under the panel or off the canvas; the next one may be free.
      }
    }
    await page.getByRole('menuitem', { name: 'Show quotes' }).waitFor()

    await shoot()
  })

  shot('the legend of the lines', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()
    await page.getByRole('button', { name: 'How to read this page' }).click()
    await page.getByText('The link is up to date and no issue is open about it.').waitFor()

    await shoot()
  })

  shot('the chain of an item without a link', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/items/${noLinkItem.id}`)
    await page.getByRole('heading', { name: `Trace of ${noLinkTitle}` }).waitFor()
    await page.getByText('This item has no link yet.').waitFor()

    await shoot()
  })

  shot('a chain that failed to load', async ({ page, shoot }) => {
    await page.goto(`${chain}?mock-traces=error`)
    await page.getByText('The trace could not load.').waitFor()

    await shoot()
  })

  shot('a chain while it loads', async ({ page, shoot }) => {
    await page.goto(`${chain}?mock-traces=loading`)
    await page.getByText('Loading the trace').waitFor()

    await shoot()
  })

  shot('the add link dialog with a preview', async ({ page, user, shoot }) => {
    await page.goto(`${project}/items/${analysisItem.id}`)
    await user.expectRole('button', 'More actions')
    await user.pressButton('More actions')
    await user.pressMenuItem('Link to another item')

    // A search of the other item, then its choice: the sentence of the link reads under the fields.
    const search = page.getByRole('combobox', { name: 'Other item' })
    await search.click()
    await search.fill('Minh')
    // An option of the search, not the title of a document of the panel beside it, which also
    // says "Minh" and sits under the overlay of the dialog.
    const persona = page.getByRole('option', { name: 'Minh' })
    await persona.waitFor()
    await persona.click()
    await user.expectText('Search with free hours will involve Minh.')

    await shoot()
  })

  shot('the links read as a list', async ({ page, shoot }) => {
    await page.goto(chain)
    await page.getByRole('heading', { name: `Trace of ${chainItemTitle}` }).waitFor()
    await page.getByRole('button', { name: 'Read the links as a list' }).click()
    // The list sits under the canvas, so it scrolls into the window before the shot.
    await page.getByRole('listitem').first().scrollIntoViewIfNeeded()

    await shoot()
  })

  shot('the item page with its menu of actions open', async ({ page, user, shoot }) => {
    await page.goto(`${project}/items/${analysisItem.id}`)
    await user.expectRole('button', 'More actions')
    await user.pressButton('More actions')

    await shoot()
  })

  shot('the chain of an out of date link', async ({ page, shoot }) => {
    await page.goto(`${project}/trace/items/${outOfDateItem.id}`)
    await page.getByRole('heading', { name: `Trace of ${outOfDateTitle}` }).waitFor()

    await shoot()
  })
})
