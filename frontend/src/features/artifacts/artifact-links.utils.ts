/** The address of an artifact in its project. */
export function artifactHref(projectId: string, artifactId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}`
}

/** The address of an item in its project. */
export function itemHref(projectId: string, itemId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/artifacts/items/${encodeURIComponent(itemId)}`
}
