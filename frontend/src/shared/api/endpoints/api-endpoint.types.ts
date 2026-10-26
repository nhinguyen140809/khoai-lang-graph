/** The names of the `:params` of a path pattern, such as `projectId` for `/projects/:projectId`. */
export type PathParamNames<Pattern extends string> =
  Pattern extends `${string}:${infer Name}/${infer Rest}`
    ? Name | PathParamNames<`/${Rest}`>
    : Pattern extends `${string}:${infer Name}`
      ? Name
      : never

/** The values of the `:params` of a path pattern. */
export type PathParams<Pattern extends string> = Record<PathParamNames<Pattern>, string | number>

/** The arguments of `path`: the values of the params, and none for a path without params. */
export type PathArguments<Pattern extends string> = [PathParamNames<Pattern>] extends [never]
  ? []
  : [params: PathParams<Pattern>]

/** One endpoint of the API, written once for the client, the mock server and the tests. */
export interface ApiEndpoint<Pattern extends string> {
  /** The path with its `:params`, the form that the mock server matches requests against. */
  pattern: Pattern
  /** The path of a request, the values of the params encoded as one path segment each. */
  path: (...args: PathArguments<Pattern>) => string
}
