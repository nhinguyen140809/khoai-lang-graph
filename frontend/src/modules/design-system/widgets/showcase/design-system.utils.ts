/**
 * The hex code of a color that the browser reports as `rgb(...)` or `rgba(...)`; any other form is
 * returned as it came, and a color with some transparency gets its alpha as a fourth pair.
 */
export function toHex(color: string): string {
  const match = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,/\s]+([\d.]+%?))?\s*\)$/.exec(color)
  if (match === null) return color
  const pair = (value: number) => Math.round(value).toString(16).padStart(2, '0')
  const [, red = '0', green = '0', blue = '0', alpha] = match
  const hex = `#${pair(Number(red))}${pair(Number(green))}${pair(Number(blue))}`
  if (alpha === undefined) return hex
  const share = alpha.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number(alpha)
  return share >= 1 ? hex : `${hex}${pair(share * 255)}`
}
