import type { PathParams } from 'msw'

/** The value of a parameter of the path that the handler matched, such as `projectId`. */
export function pathParam(params: PathParams, name: string): string {
  return String(params[name])
}
