import { useQuery } from '@tanstack/react-query'

import { issueLinkTypes } from '../issue-kinds.constants'
import { openIssues } from '../issues.utils'
import { listLinks, listProjectItems } from '../traceability.api'

/** The open issues of a project, with the items that they are about. */
export function useIssues(projectId: string) {
  return useQuery({
    queryKey: ['traceability', 'issues', projectId],
    queryFn: async () => {
      const [items, links] = await Promise.all([
        listProjectItems(projectId),
        listLinks(projectId, issueLinkTypes),
      ])
      return openIssues(items, links)
    },
  })
}
