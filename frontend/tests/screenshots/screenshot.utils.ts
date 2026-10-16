import path from 'node:path'

import { expect, type Locator, type Page, test } from '@playwright/test'

const SCREENSHOTS = path.join(import.meta.dirname, '../../screenshots')

// The badge and the error overlay of the dev server.
const HIDDEN = 'nextjs-portal { display: none !important; }'

/** A state of a page to take, and the steps to it. */
export interface Shot {
  /** What the state shows, such as "Loading"; it names the test and the file. */
  name: string
  /** The steps from a new browser page to the state. */
  steps: (page: Page) => Promise<void>
  /**
   * What shows once the state is reached, when the network goes quiet before it: an error shows
   * after the app tries again, a second later.
   */
  ready?: (page: Page) => Locator
  /** The part of the page to take, when the state changes only that part, such as the status bar. */
  part?: (page: Page) => Locator
  /** What the pointer is over when the state is taken. */
  hover?: (page: Page) => Locator
  /** Takes the whole length of the page instead of the window. */
  fullPage?: boolean
}

/** The steps to a state that an address alone shows. */
export function visit(address: string): Shot['steps'] {
  return async (page) => {
    await page.goto(address)
  }
}

/**
 * Waits until the page shows what it loads: the app renders once the mocks control the page, and
 * then loads its data. A state that loads never gets an answer, so the wait for the network gives
 * up after a while and the page is taken as it is.
 */
async function settle(page: Page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Takes each state of a page in a test of its own, into screenshots/<window>-<theme>/. A file
 * starts with the name of the page and the number of the state, so that the files of a page sort
 * in the order of its states.
 */
export function takeShots(pageName: string, shots: Shot[]) {
  test.describe(pageName, () => {
    for (const [index, shot] of shots.entries()) {
      test(shot.name, async ({ page }, testInfo) => {
        await shot.steps(page)
        if (shot.ready !== undefined)
          await expect(shot.ready(page)).toBeVisible({ timeout: 20_000 })
        await settle(page)
        // A step that clicks leaves the pointer over a row or a button, which would show it hovered.
        await page.mouse.move(0, 0)
        await shot.hover?.(page).hover()

        const file = `${slug(pageName)}--${String(index + 1).padStart(2, '0')}-${slug(shot.name)}.png`
        const options = {
          path: path.join(SCREENSHOTS, testInfo.project.name, file),
          animations: 'disabled',
          style: HIDDEN,
        } as const
        await (shot.part === undefined
          ? page.screenshot({ ...options, fullPage: shot.fullPage ?? false })
          : shot.part(page).screenshot(options))
      })
    }
  })
}
