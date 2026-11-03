import { type ReplaceUserSettingsBody, themes, uiLanguages } from '@/modules/user/entities'
import type { FieldProblem } from '@/shared/api/error'
import { outputLanguages } from '@/shared/config/output-language'

import { validateRunDefaults } from '../runs/runs.validators'
import { bodyProblems } from '../shared/http/validation'

// What the body of the request that replaces the settings of the user may hold. The checks are the
// rules of the API.

const userSettingsBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    theme: { enum: [...themes] },
    ui_language: { enum: [...uiLanguages] },
    default_output_language: { enum: [...outputLanguages] },
    // Checked apart, with the rules of the run settings.
    default_run_config: {},
    notify_on_interrupt: { type: 'boolean' },
    notify_on_run_finished: { type: 'boolean' },
  },
}

/** The settings to change, a field left out being kept; else the problems of the body. */
export function validateUserSettingsBody(
  given: Record<string, unknown>,
): { fields: ReplaceUserSettingsBody } | { problems: FieldProblem[] } {
  const problems = bodyProblems(userSettingsBodySchema, given)
  const { default_run_config: runConfig, ...others } = given
  let fields = others as ReplaceUserSettingsBody
  if ('default_run_config' in given) {
    const checked = validateRunDefaults(runConfig, 'default_run_config')
    if ('problems' in checked) problems.push(...checked.problems)
    else fields = { ...fields, default_run_config: checked.runDefaults }
  }
  return problems.length > 0 ? { problems } : { fields }
}
