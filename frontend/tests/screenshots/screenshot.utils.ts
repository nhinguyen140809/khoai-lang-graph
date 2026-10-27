import path from 'node:path'

import type { Locator, Page } from '@playwright/test'

import { test } from '../shared/fixtures.utils'
import type { UserSteps } from '../shared/steps'

const SCREENSHOTS = path.join(import.meta.dirname, '../../screenshots')

// The badge and the error overlay of the dev server.
const HIDDEN = 'nextjs-portal { display: none !important; }'

/** What a screenshot takes, when it is not the window as it is. */
interface ShootOptions {
  /** The part of the page to take, when the state changes only that part, such as the status bar. */
  part?: Locator
  /** What the pointer is over when the state is taken. */
  hover?: Locator
  /** Takes the whole length of the page instead of the window. */
  fullPage?: boolean
}

/** What the test of a state gets: the page, the user on it, and `shoot` that takes the state. */
interface ShotFixtures {
  page: Page
  user: UserSteps
  shoot: (options?: ShootOptions) => Promise<void>
}

/**
 * Declares the test of one state of a page; the states of a page are numbered in the order
 * declared. `at` declares a state that an address alone shows.
 */
interface ShotTest {
  (name: string, body: (fixtures: ShotFixtures) => Promise<void>): void
  at: (name: string, address: string, options?: Pick<ShootOptions, 'fullPage'>) => void
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
 * Declares the states of a page. Each one is a test of the same shape as an E2E test, which
 * reaches the state and calls `shoot()` to take it into screenshots/<window>-<theme>/. A file
 * starts with the name of the page and the number of the state, so that the files of a page sort
 * in the order in which its states are declared. A state waits for what it shows before `shoot()`,
 * such as an error that appears after the app tries again.
 */
export function screenshots(pageName: string, declare: (shot: ShotTest) => void) {
  test.describe(pageName, () => {
    // The tests of a file are declared in the same order in every worker, so the numbers agree.
    let count = 0
    const shot: ShotTest = Object.assign(declareOne, { at })
    declare(shot)

    function at(name: string, address: string, options?: Pick<ShootOptions, 'fullPage'>) {
      declareOne(name, async ({ page, shoot }) => {
        await page.goto(address)

        await shoot(options)
      })
    }

    function declareOne(name: string, body: (fixtures: ShotFixtures) => Promise<void>) {
      count += 1
      const file = `${slug(pageName)}--${String(count).padStart(2, '0')}-${slug(name)}.png`
      test(name, async ({ page, user }, testInfo) => {
        const shoot = async ({ part, hover, fullPage = false }: ShootOptions = {}) => {
          await settle(page)
          // A step that clicks leaves the pointer over a row or a button, which would show it hovered.
          await page.mouse.move(0, 0)
          await hover?.hover()
          const options = {
            path: path.join(SCREENSHOTS, testInfo.project.name, file),
            animations: 'disabled',
            style: HIDDEN,
          } as const
          await (part === undefined
            ? page.screenshot({ ...options, fullPage })
            : part.screenshot(options))
        }
        await body({ page, user, shoot })
      })
    }
  })
}
