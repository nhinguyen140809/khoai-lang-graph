import type { ArtifactItem } from '@/modules/artifact/entities'
import type { Matrix } from '@/modules/trace/entities'
import { assertPresent } from '@/shared/lib/guards'

import type { MatrixCells, ProjectLinks } from '../trace-links.types'
import { chain, derivationLevels, evidenceKey, matrixColumns } from '../traceability.constants'
import { distinctById, itemsAndLinksOf, toSummary } from './project-links.lookup'

// The matrix of a project: its chains from the top of the derivation down to the interview. Its
// columns are the levels of the chain and the interview, so it follows the kinds of the definition.

const lastLevel = derivationLevels.length - 1
const emptyCells: MatrixCells = Object.fromEntries(matrixColumns.map(({ key }) => [key, []]))

function columnKeyOf(level: number): string {
  return assertPresent(matrixColumns[level], `The matrix has no column ${String(level)}`).key
}

function kindsAt(level: number): string[] {
  return assertPresent(derivationLevels[level], `The chain has no level ${String(level)}`)
}

// The interview messages that some items were taken from.
function evidenceOf(items: ArtifactItem[], { targetsOf }: ProjectLinks): MatrixCells {
  const messages = distinctById(items.flatMap((item) => targetsOf(item, chain.evidence)))
  return { [evidenceKey]: messages.map(toSummary) }
}

// The rows of the chains that start at an item of a level, going down. Where an item has several
// items below it, each gets a row. The last level is one cell holding all that the item above it
// was derived from, with the interview messages those items were taken from.
function chainsFrom(item: ArtifactItem, level: number, project: ProjectLinks): MatrixCells[] {
  const own = { [columnKeyOf(level)]: [toSummary(item)] }
  const below = level + 1
  const belowKinds = kindsAt(below)
  const derivedItems = project
    .targetsOf(item, chain.derivation)
    .filter(({ kind }) => belowKinds.includes(kind))
  if (below === lastLevel) {
    return [
      {
        ...own,
        [columnKeyOf(below)]: derivedItems.map(toSummary),
        ...evidenceOf(derivedItems, project),
      },
    ]
  }
  if (derivedItems.length === 0) return [own]
  return derivedItems.flatMap((derivedItem) =>
    chainsFrom(derivedItem, below, project).map((rest) => ({ ...own, ...rest })),
  )
}

// The items of a project that are of the kinds of a level of the chain.
function itemsAt(level: number, { items }: ProjectLinks): ArtifactItem[] {
  return items.filter(({ kind }) => kindsAt(level).includes(kind))
}

// The rows of the chains that start at the items of the top.
function chainRows(project: ProjectLinks): MatrixCells[] {
  return itemsAt(0, project).flatMap((item) => chainsFrom(item, 0, project))
}

// The rows with one more row for each item below the top that no row reaches: it starts a row of
// its own. A level is checked after the rows of the levels above it, so a row that an item
// starts can reach the items under it.
function withOrphanRows(rows: MatrixCells[], project: ProjectLinks): MatrixCells[] {
  let allRows = rows
  for (let level = 1; level < lastLevel; level += 1) {
    const inRows = new Set(
      allRows.flatMap((row) => row[columnKeyOf(level)]?.map(({ item_id }) => item_id) ?? []),
    )
    const orphanRows = itemsAt(level, project)
      .filter(({ id }) => !inRows.has(id))
      .flatMap((item) => chainsFrom(item, level, project))
    allRows = [...allRows, ...orphanRows]
  }
  return allRows
}

/** The matrix of a project: one row for each chain from the top of the derivation down to the interview. */
export function matrixOf(projectId: string): Matrix {
  const project = itemsAndLinksOf(projectId)
  const rows = withOrphanRows(chainRows(project), project)
  return {
    columns: matrixColumns,
    rows: rows.map((cells) => ({ cells: { ...emptyCells, ...cells } })),
  }
}
