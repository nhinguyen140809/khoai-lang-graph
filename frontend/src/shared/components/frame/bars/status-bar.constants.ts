/** The sides of the status bar, which hold the items registered with `useStatusBarItem`. */
export const StatusBarSide = {
  /** What the screen reports about its work, such as the run of the project. */
  Left: 'left',
  /** What the page on screen reports, before the notifications at the end of the bar. */
  Right: 'right',
} as const

export type StatusBarSide = (typeof StatusBarSide)[keyof typeof StatusBarSide]
