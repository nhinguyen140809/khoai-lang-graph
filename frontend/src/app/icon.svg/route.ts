import { HttpHeader, MediaType } from '@/shared/api/http'
import {
  logoIconColors,
  logoIconCornerRadius,
  logoLetter,
  logoViewBox,
} from '@/shared/components/brand'

// The icon of the tab, drawn from the same constants as `LogoMark`. It follows the color scheme of
// the system, as the tab does, so it holds the colors of both schemes. It changes only with the
// code, so Next.js builds it once, and a browser keeps it for an hour.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="${logoViewBox}">
  <style>
    .square { fill: ${logoIconColors.light.square}; }
    .letter { stroke: ${logoIconColors.light.letter}; }
    @media (prefers-color-scheme: dark) {
      .square { fill: ${logoIconColors.dark.square}; }
      .letter { stroke: ${logoIconColors.dark.letter}; }
    }
  </style>
  <rect class="square" width="16" height="16" rx="${String(logoIconCornerRadius)}" />
  <path class="letter" d="${logoLetter.path}" fill="none" stroke-width="${String(logoLetter.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`

export function GET() {
  return new Response(icon, {
    headers: {
      [HttpHeader.ContentType]: MediaType.Svg,
      [HttpHeader.CacheControl]: 'public, max-age=3600',
    },
  })
}
