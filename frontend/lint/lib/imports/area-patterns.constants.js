// The areas of src/app/, one for each view. The pages of a view place what is shared and what is
// marked for their view (the tag `@view`, read by the rule view-boundary; see view-tag.constants.js).

/**
 * The rule that maps a host to its view and an address to its area is read by `src/proxy.ts` and
 * the route helper of `src/shared/routes/typed-route` only; every other part takes the view from
 * the area it sits in.
 */
export const viewAreaPattern = {
  group: ['@/shared/routes/hosts', '@/shared/routes/hosts/**'],
  message:
    'Only the proxy and the route helper read the host of a request and the areas of the views: read the view with useView of @/shared/lib/view (CONTRIBUTING: Areas of the app).',
}
