import type { RunDefaults } from '@/modules/run/entities'
import type { FieldProblem } from '@/shared/api/error'

import { modelIdsForRole } from '../models/models.lookup'
import { validateRunDefaults } from '../runs/runs.validators'
import {
  choiceProblem,
  jsonObject,
  jsonObjectProblem,
  requiredText,
  requiredTextProblem,
} from '../shared/http/validation'
import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'
import type { MessageToSend } from './messages.types'

// What the body of the request that sends a message may hold: the content, the settings of the run
// it starts, and the model of each agent role of that run. The checks are the rules of the API.

/**
 * The message to send as the body gives it: its content, the settings and the models of the run it
 * starts; else every problem of the body, each at the field that the API names.
 */
export function validateSentMessageBody(
  given: Record<string, unknown>,
): { message: MessageToSend } | { problems: FieldProblem[] } {
  const content = requiredText(given.content)
  const problems: FieldProblem[] = []
  if (content === undefined) problems.push(requiredTextProblem('content'))
  let runDefaults: RunDefaults | undefined
  if (given.run_config !== undefined) {
    const checked = validateRunDefaults(given.run_config)
    if ('problems' in checked) problems.push(...checked.problems)
    else runDefaults = checked.runDefaults
  }
  let models: Record<string, string> | undefined
  if (given.models !== undefined) {
    const checked = validateModels(given.models)
    if ('problems' in checked) problems.push(...checked.problems)
    else models = checked.models
  }
  if (content === undefined || problems.length > 0) return { problems }
  return {
    message: {
      content,
      ...(runDefaults !== undefined && { runDefaults }),
      ...(models !== undefined && { models }),
    },
  }
}

/**
 * The models of the run that the message starts, by agent role, each a model of the catalog that
 * serves its role; else the problems of the field.
 */
function validateModels(
  given: unknown,
): { models: Record<string, string> } | { problems: FieldProblem[] } {
  const object = jsonObject(given)
  if (object === undefined) return { problems: [jsonObjectProblem('models')] }
  const roles = new Set(workflowDefinitionFixture.agent_roles.map(({ key }) => key))
  const models: Record<string, string> = {}
  const problems: FieldProblem[] = []
  for (const [role, model] of Object.entries(object)) {
    if (!roles.has(role)) {
      problems.push(choiceProblem(`models.${role}`))
      continue
    }
    const text = requiredText(model)
    if (text === undefined) problems.push(requiredTextProblem(`models.${role}`))
    else if (!modelIdsForRole(role).includes(text)) problems.push(choiceProblem(`models.${role}`))
    else models[role] = text
  }
  return problems.length > 0 ? { problems } : { models }
}
