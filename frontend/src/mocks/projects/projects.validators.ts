import type { FieldProblem } from '@/shared/api/error'
import { outputLanguages } from '@/shared/config/output-language'
import { isString } from '@/shared/lib/guards'

import { choice, optionalText, optionalTextProblem } from '../shared/http/validation'
import type { NewProjectRecord } from './projects.types'

// What the body of the request that creates a project may hold.

// The fields of a new project read from the body; a field given wrong reads as undefined. A name
// left out or blank is null: the agents name the project from its first message.
export function validateNewProject(
  given: Record<string, unknown>,
): { project: NewProjectRecord } | { problems: FieldProblem[] } {
  const givenName = optionalText(given.name)
  const name = isString(givenName) ? givenName.trim() || null : givenName
  const description = optionalText(given.description)
  const language =
    given.output_language === undefined ? 'en' : choice(outputLanguages, given.output_language)
  if (name !== undefined && description !== undefined && language !== undefined) {
    return { project: { name, description, output_language: language } }
  }
  const problems: FieldProblem[] = []
  if (name === undefined) problems.push(optionalTextProblem('name'))
  if (description === undefined) problems.push(optionalTextProblem('description'))
  if (language === undefined) {
    problems.push({ field: 'output_language', message: 'Choose a language.' })
  }
  return { problems }
}
