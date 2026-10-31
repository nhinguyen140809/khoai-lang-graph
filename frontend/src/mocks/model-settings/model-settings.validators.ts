import type { ReplaceModelSettingsBody } from '@/modules/llm-model/entities'
import type { FieldProblem } from '@/shared/api/error'

import { modelIdsForRole } from '../models/models.lookup'
import { bodyProblems, choice, choiceProblem, jsonObject } from '../shared/http/validation'
import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'

// What the body of the request that replaces the model settings may hold: a list of the model of
// each agent role. The checks are the rules of the API.

const modelSettingsBodySchema = {
  type: 'object',
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['agent_role', 'model_id'],
        properties: {
          agent_role: { type: 'string' },
          model_id: { type: 'string' },
          temperature: { type: ['number', 'null'], minimum: 0, maximum: 1 },
        },
      },
    },
  },
}

type ModelSettingChoice = ReplaceModelSettingsBody['items'][number]

// The choice of one entry of `items` whose shape is right, or the problem of its role or model. `taken`
// holds the roles of the entries before it.
function readModelSettingChoice(
  entry: Record<string, unknown>,
  entryField: string,
  taken: Set<string>,
): { choice: ModelSettingChoice } | { problem: FieldProblem } {
  const roles = workflowDefinitionFixture.agent_roles.map(({ key }) => key)
  const role = choice(roles, entry.agent_role)
  if (role === undefined) return { problem: choiceProblem(`${entryField}.agent_role`) }
  if (taken.has(role)) {
    return { problem: { field: `${entryField}.agent_role`, message: 'Give each role once.' } }
  }
  taken.add(role)
  const modelId = choice(modelIdsForRole(role), entry.model_id)
  if (modelId === undefined) return { problem: choiceProblem(`${entryField}.model_id`) }
  const temperature = typeof entry.temperature === 'number' ? entry.temperature : null
  return { choice: { agent_role: role, model_id: modelId, temperature } }
}

/**
 * The choices of the body: a model and a temperature for each agent role, a temperature left out
 * being null; else every problem of the body, each at the field that the API names.
 */
export function validateModelSettings(
  given: Record<string, unknown>,
): { choices: ModelSettingChoice[] } | { problems: FieldProblem[] } {
  const problems = bodyProblems(modelSettingsBodySchema, given)
  const choices: ModelSettingChoice[] = []
  const taken = new Set<string>()
  const entries: unknown[] = Array.isArray(given.items) ? given.items : []
  for (const [index, entry] of entries.entries()) {
    const object = jsonObject(entry)
    const entryField = `items.${String(index)}`
    // An entry with a problem of shape has no role or model to check.
    const hasShapeProblem = problems.some(({ field }) => field.startsWith(`${entryField}.`))
    if (object === undefined || hasShapeProblem) continue
    const checked = readModelSettingChoice(object, entryField, taken)
    if ('problem' in checked) problems.push(checked.problem)
    else choices.push(checked.choice)
  }
  return problems.length > 0 ? { problems } : { choices }
}
