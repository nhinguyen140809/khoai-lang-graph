import { screen } from '@testing-library/react'

import { pressRole } from './form.utils'

// The steps of a test that reads the frame of the app, as renderWorkbench of @/test/render draws
// it: the items of the status bar and the commands of the palette.

/** The status bar, the footer of the frame. */
export function statusBar() {
  return screen.getByRole('contentinfo')
}

/** Opens the command palette with its button on the top bar. */
export async function openCommandPalette() {
  await pressRole('button', /Search or run a command/)
}
