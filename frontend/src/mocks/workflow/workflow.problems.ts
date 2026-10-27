import { notFound } from '../shared/http/response'

/** The answer to a request for a version of the workflow definition that does not exist. */
export function definitionVersionNotFound() {
  return notFound('The workflow version')
}
