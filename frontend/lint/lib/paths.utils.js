import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/** The folder of the frontend, where package.json and src/ are. */
export const frontendRoot = path.resolve(import.meta.dirname, '../..')

/**
 * The names of the folders inside a folder of the frontend.
 * @param {string} folder
 * @returns {string[]}
 */
export function foldersOf(folder) {
  const root = path.join(frontendRoot, folder)
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}
