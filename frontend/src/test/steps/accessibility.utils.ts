import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Checks what is rendered with axe. Two rules are off since jsdom cannot answer them: the contrast
 * of colors (it computes no styles) and the landmarks of a whole page (a test renders a part).
 */
export async function expectNoAccessibilityViolations(container: Element = document.body) {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })

  expect(
    violations.map(
      ({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`,
    ),
  ).toEqual([])
}
