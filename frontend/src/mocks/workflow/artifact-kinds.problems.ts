import { notFound } from '../shared/http/response'

/** The answer to a request for a content schema that the workflow does not define. */
export function contentSchemaNotFound() {
  return notFound('The content schema')
}
