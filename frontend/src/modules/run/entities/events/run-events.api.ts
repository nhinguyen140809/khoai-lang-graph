import { apiEndpoints } from '@/shared/api/endpoints'
import { apiUrl } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

/**
 * The address of the event stream of a run: from its first event, or from the events after
 * `after`, the id of the last event read.
 */
export function runEventsUrl(runId: string, after: string | null = null): string {
  return apiUrl(
    pathWithQuery(apiEndpoints.runStream.path({ runId }), { after: after ?? undefined }),
  )
}
