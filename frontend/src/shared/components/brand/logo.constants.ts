/** The square of the logo is drawn in a box of this size, and the letter in it. */
export const logoViewBox = '0 0 16 16'

/** The corner of the square of the icon of the tab, in the units of `logoViewBox`. */
export const logoIconCornerRadius = 3

/**
 * The letter K as a stroke: a stem and two arms. It is 40% of the height of the square, which
 * leaves 30% of padding above and below it. `LogoMark` and the icon of the tab draw this path.
 */
export const logoLetter = {
  path: 'M6 4.8v6.4M10 4.8 6.4 8l3.8 3.2',
  strokeWidth: 1.2,
} as const

/**
 * The colors of the icon of the tab, which cannot read the tokens of the app: the primary color of
 * `styles.css` and the color of the text on it, in each of the two color schemes of the system.
 */
export const logoIconColors = {
  light: { square: '#3755cd', letter: '#ffffff' },
  dark: { square: '#8fa5ff', letter: '#011627' },
} as const
