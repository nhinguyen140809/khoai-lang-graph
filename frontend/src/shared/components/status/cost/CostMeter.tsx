import { GaugeIcon } from 'lucide-react'

import { Progress } from '@/shared/components/ui/progress'
import type { CostLevel } from '@/shared/lib/cost'
import { formatPercent } from '@/shared/lib/formatters/percentage.utils'
import { toneClasses } from '@/shared/lib/tone'
import { cn } from '@/shared/lib/utils'

import { costLevelTones } from './cost-level.constants'

interface CostMeterProps {
  /** The percent of its limit that the cost has reached, over 100 once past it. */
  percent: number
  level: CostLevel
  /** What the meter measures, which names it to assistive technology, such as "Monthly budget used". */
  label: string
}

/**
 * The share of its limit that a cost has reached: a gauge, a bar and the percent, with no fill, in
 * the color of its level.
 */
export function CostMeter({ percent, level, label }: CostMeterProps) {
  const tone = costLevelTones[level]
  const shown = formatPercent(percent)

  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1.5 text-sm text-(--tone-strong) [&_svg]:size-3.5',
        toneClasses[tone],
      )}
    >
      <GaugeIcon aria-hidden />
      {/* A cost over its limit fills the bar. The bar says the percent to assistive technology,
          so the text beside it is not read twice. */}
      <Progress
        value={Math.min(percent, 100)}
        color={tone}
        aria-label={label}
        getValueLabel={() => shown}
        // Thick enough to read as the main number of the item; the track shows on the status bar.
        className="h-2 w-16 bg-foreground/10"
      />
      <span aria-hidden className="tabular-nums">
        {shown}
      </span>
    </span>
  )
}
