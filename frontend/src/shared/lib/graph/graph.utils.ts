/**
 * What each id leads to, from a list of edges: for an id, the ids at the other end of the edges
 * that leave it, in the order of the list. The index is built once, so a walk over many ids reads
 * the edges once.
 */
export function successorsFrom<E>(
  edges: readonly E[],
  fromOf: (edge: E) => string,
  toOf: (edge: E) => string,
): (id: string) => readonly string[] {
  const successors = new Map<string, string[]>()
  for (const edge of edges) {
    const from = fromOf(edge)
    const leadsTo = successors.get(from) ?? []
    leadsTo.push(toOf(edge))
    successors.set(from, leadsTo)
  }
  return (id) => successors.get(id) ?? []
}

/**
 * The fewest steps from the start ids to every id they lead to, found level by level. An id leads
 * to the ids that `successorsOf` gives. The start ids are 0 steps away; with a `maxDistance`, the
 * ids further away are left out, and with null, the walk goes as far as the ids lead. An id is
 * reached once, so a loop ends the walk.
 */
export function distancesFrom(
  startIds: readonly string[],
  successorsOf: (id: string) => readonly string[],
  maxDistance: number | null,
): Map<string, number> {
  const distances = new Map(startIds.map((id) => [id, 0]))
  let lastLevel = [...distances.keys()]
  for (let distance = 1; lastLevel.length > 0; distance += 1) {
    if (maxDistance !== null && distance > maxDistance) break
    const nextLevel: string[] = []
    for (const id of lastLevel) {
      for (const successor of successorsOf(id)) {
        if (distances.has(successor)) continue
        distances.set(successor, distance)
        nextLevel.push(successor)
      }
    }
    lastLevel = nextLevel
  }
  return distances
}
