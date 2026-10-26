import { encodeId } from '@/shared/lib/url'

import type { ApiEndpoint } from './api-endpoint.types'

/** Where every path of the API starts. */
export const apiBasePath = '/api/v1'

/** An endpoint of the API from its pattern after the base path, such as `/projects/:projectId`. */
export function apiEndpoint<Pattern extends string>(
  route: Pattern,
): ApiEndpoint<`${typeof apiBasePath}${Pattern}`> {
  const pattern = `${apiBasePath}${route}` as const
  return {
    pattern,
    path: (...args) => {
      const params: Readonly<Record<string, string | number>> = args[0] ?? {}
      return pattern.replace(/:(\w+)/g, (_, name: string) => encodeId(String(params[name] ?? '')))
    },
  }
}
