/** The address of the traceability view, with the view and the gap that are chosen. */
export function traceabilityHref(
  projectId: string,
  options: { view?: 'issues'; gap?: string } = {},
): string {
  const query = new URLSearchParams()
  if (options.view !== undefined) query.set('view', options.view)
  if (options.gap !== undefined) query.set('gap', options.gap)
  const text = query.toString()
  return `/projects/${encodeURIComponent(projectId)}/traceability${text === '' ? '' : `?${text}`}`
}

/** The address of an item in Artifacts. */
export function itemHref(projectId: string, itemId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/artifacts/items/${encodeURIComponent(itemId)}`
}
