import type { Rgba } from './color.types'

/**
 * The red, green, blue and alpha of a color as it looks inside an element: custom properties that
 * the element or its parents give (`var(--face-a)`) and functions such as `color-mix` and
 * `oklch` are worked out by the browser first, and the result is read off a canvas, which takes any
 * color the browser knows. The answer is for the theme the element is in now.
 */
export function rgbaOf(element: Element, color: string): Rgba {
  const document = element.ownerDocument
  const probe = document.createElement('span')
  probe.style.color = color
  element.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (context === null) return [0, 0, 0, 255]
  context.clearRect(0, 0, 1, 1)
  context.fillStyle = resolved
  context.fillRect(0, 0, 1, 1)
  const [red = 0, green = 0, blue = 0, alpha = 255] = context.getImageData(0, 0, 1, 1).data
  return [red, green, blue, alpha]
}
