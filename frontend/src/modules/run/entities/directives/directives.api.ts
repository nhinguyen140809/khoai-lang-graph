import { apiEndpoints } from '@/shared/api/endpoints'
import { fetchPage, type ListPage } from '@/shared/api/request'

import { type Directive, directiveSchema } from './directives.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the directives of a run, by the loop they start; they say why the run looped. */
export function listRunDirectives(
  runId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Directive>> {
  return fetchPage(apiEndpoints.runDirectives.path({ runId }), directiveSchema, {
    limit,
    cursor,
    action: 'load the directives of the run',
  })
}
