import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { CatalogEntry } from './docs-files.types'

/** The entries of a catalog of `docs/workflow/`, read from the root of the repository: what the web app has to agree with. */
export function catalogEntries(file: string, list: 'acts' | 'commands'): CatalogEntry[] {
  const catalog = JSON.parse(
    readFileSync(resolve(process.cwd(), '../docs/workflow', file), 'utf8'),
  ) as Partial<Record<'acts' | 'commands', CatalogEntry[]>>
  return catalog[list] ?? []
}

/** The keys of a catalog of `docs/workflow/`, in the order it lists them. */
export function catalogKeys(file: string, list: 'acts' | 'commands'): string[] {
  return catalogEntries(file, list).map(({ key }) => key)
}

/** The name that a definition file of `docs/workflow/` gives its workflow. */
export function readWorkflowDefinitionName(file: string): string {
  const definition = JSON.parse(
    readFileSync(resolve(process.cwd(), '../docs/workflow', file), 'utf8'),
  ) as { name: string }
  return definition.name
}
