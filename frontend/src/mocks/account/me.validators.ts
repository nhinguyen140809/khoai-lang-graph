import type { UpdateMeBody } from '@/modules/user/entities'
import type { FieldProblem } from '@/shared/api/error'

import { bodyProblems, requiredText, requiredTextProblem } from '../shared/http/validation'
import { currentPassword } from './account.store'

// What the bodies of the requests that change the user and the password may hold. The checks are
// the rules of the API.

const maxDisplayNameLength = 100
const minPasswordLength = 8

const updateMeBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    display_name: { type: 'string' },
    avatar_url: { type: ['string', 'null'] },
  },
}

const changePasswordBodySchema = {
  type: 'object',
  required: ['current_password', 'new_password'],
  additionalProperties: false,
  properties: {
    current_password: { type: 'string' },
    new_password: { type: 'string' },
  },
}

function isHttpAddress(value: string): boolean {
  if (!URL.canParse(value)) return false
  const { protocol } = new URL(value)
  return protocol === 'http:' || protocol === 'https:'
}

// The problem of a name that is blank or too long, if it has one.
function displayNameProblem(name: string): FieldProblem | undefined {
  const trimmed = requiredText(name)
  if (trimmed === undefined) return requiredTextProblem('display_name')
  if (trimmed.length <= maxDisplayNameLength) return undefined
  return {
    field: 'display_name',
    message: `Use at most ${String(maxDisplayNameLength)} characters.`,
  }
}

/** The fields to change, a field left out being kept; else the problems of the body. */
export function validateUpdateMeBody(
  given: Record<string, unknown>,
): { fields: UpdateMeBody } | { problems: FieldProblem[] } {
  const problems = bodyProblems(updateMeBodySchema, given)
  const { display_name: displayName, avatar_url: avatarUrl } = given
  if (typeof displayName === 'string') {
    const problem = displayNameProblem(displayName)
    if (problem !== undefined) problems.push(problem)
  }
  if (typeof avatarUrl === 'string' && !isHttpAddress(avatarUrl)) {
    problems.push({ field: 'avatar_url', message: 'Send an http or https address.' })
  }
  return problems.length > 0 ? { problems } : { fields: given }
}

/** The new password; else the problems of the body, the current password checked first. */
export function validateChangePasswordBody(
  given: Record<string, unknown>,
): { password: string } | { problems: FieldProblem[] } {
  const problems = bodyProblems(changePasswordBodySchema, given)
  if (problems.length > 0) return { problems }
  const current = String(given.current_password)
  const next = String(given.new_password)
  if (current !== currentPassword.get()) {
    return { problems: [{ field: 'current_password', message: 'The current password is wrong.' }] }
  }
  if (next.length < minPasswordLength) {
    return {
      problems: [
        { field: 'new_password', message: `Use at least ${String(minPasswordLength)} characters.` },
      ],
    }
  }
  if (next === current) {
    return {
      problems: [
        { field: 'new_password', message: 'Choose a password other than the current one.' },
      ],
    }
  }
  return { password: next }
}
