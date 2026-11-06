import type { CheckpointOption } from '@/modules/workflow/entities/@x/review'

import type { Interrupt } from './interrupts.types'

/** The option that answered a review; null while it waits, without options, or once cancelled. */
export function decisionOption(
  interrupt: Pick<Interrupt, 'options' | 'decision'>,
): CheckpointOption | null {
  const option = interrupt.decision?.option
  const chosen = option === null ? undefined : interrupt.options.find(({ key }) => key === option)
  return chosen ?? null
}
