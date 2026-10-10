import { useQuery } from '@tanstack/react-query'

import { getProjectDefaults } from '../projects.api'

/** The settings of the user that a new project starts from. */
export function useProjectDefaults() {
  return useQuery({ queryKey: ['projects', 'defaults'], queryFn: getProjectDefaults })
}
