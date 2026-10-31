import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

const path = apiEndpoints.modelSettings.path()
const analyst = { agent_role: 'analyst', model_id: 'openai:gpt-4.1' }

function put(name: string, body: unknown, field: string, message: string): RejectedRequestCase {
  return {
    name,
    method: 'PUT',
    path,
    body,
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field, message }] },
  }
}

/** A request to the model settings that the mock server refuses. */
export const rejectedCases: RejectedRequestCase[] = [
  put('answers 422 for a body without items', {}, 'items', 'This field is required.'),
  put(
    'answers 422 for a role that is not one of the definition',
    { items: [{ ...analyst, agent_role: 'chef' }] },
    'items.0.agent_role',
    'Choose one of the values.',
  ),
  put(
    'answers 422 for a role given twice',
    { items: [analyst, analyst] },
    'items.1.agent_role',
    'Give each role once.',
  ),
  put(
    'answers 422 for a model that does not serve its role',
    { items: [{ ...analyst, model_id: 'openai:gpt-4.1-mini' }] },
    'items.0.model_id',
    'Choose one of the values.',
  ),
  put(
    'answers 422 for a temperature of 1.5',
    { items: [{ ...analyst, temperature: 1.5 }] },
    'items.0.temperature',
    'Send 1 or less.',
  ),
  put(
    'answers 422 for a field that is not allowed',
    { items: [{ ...analyst, color: 'red' }] },
    'items.0.color',
    'This field is not allowed.',
  ),
  {
    name: 'answers 500 for GET in the error scenario',
    method: 'GET',
    path,
    page: '/?mock-model-settings=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 500 for PUT in the error scenario',
    method: 'PUT',
    path,
    body: { items: [] },
    page: '/?mock-replace-model-settings=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
