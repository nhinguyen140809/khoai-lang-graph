import type { RunDefaultsFieldValues } from './run-defaults.schema'

/** The words of the fields of the run settings. */
export const runDefaultsMessages = {
  checkpointsLegend: 'Reviews',
  defaultChoice: 'Default',
  flagOn: 'On',
  flagOff: 'Off',
  maxSteps: 'Maximum steps',
  maxCostUsd: 'Cost limit (USD)',
  parametersLegend: 'Limits',
  appliesNote:
    'Applies to the runs that start after you save. A run in progress keeps its settings.',
}

/** The key of the choice of a select that leaves the parameter to the next level. */
export const defaultSelectKey = 'default'

/**
 * The values of the fields of the run settings with nothing set: each field takes the value of the
 * next level, and a parameter not in the values starts empty.
 */
export const noRunDefaultsFieldValues: RunDefaultsFieldValues = {
  review_checkpoints: null,
  max_steps: undefined,
  max_cost_usd: undefined,
  parameters: {},
}
