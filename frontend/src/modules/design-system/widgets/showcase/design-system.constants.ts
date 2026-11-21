import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleOffIcon,
  InfoIcon,
  type LucideIcon,
  OctagonXIcon,
  StarIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import type { Tone } from '@/shared/lib/tone'

/** A status icon per tone; inside a component, the icon takes the color the tone gives the text. */
export const toneIcons: Record<Tone, LucideIcon> = {
  neutral: CircleDashedIcon,
  primary: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  destructive: OctagonXIcon,
  secondary: StarIcon,
  muted: CircleOffIcon,
  accent: CircleDotIcon,
}
