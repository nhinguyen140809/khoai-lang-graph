import { moduleLayers } from '../modules/module-imports.constants.js'
import { readModuleNames } from '../modules/module-names.utils.js'
import { foldersOf } from '../paths.utils.js'
import { fileKinds, kebabCasePattern, kindFolders } from './file-kinds.constants.js'

/**
 * The name of a file of these kinds: <subject>.<kind>.ts, the subject in kebab-case.
 * @param {string[]} kinds
 */
export function kindFileNamePattern(kinds) {
  return `${kebabCasePattern}.@(${kinds.join('|')})`
}

// The folders at the root of a slice: one for each kind it holds, components/, hooks/ and the
// unit tests, and in the entities the @x folder.
/** @param {'entities' | 'features' | 'widgets'} layer */
function sliceFolderNames(layer) {
  const own = fileKinds[layer].map((kind) => {
    const folder = kindFolders[kind]
    if (folder === undefined) {
      throw new Error(`The kind ${kind} of ${layer} has no folder in kindFolders.`)
    }
    return folder
  })
  const extra = layer === 'entities' ? ['@x'] : []
  return `@(${[...own, 'components', 'hooks', '__tests__', ...extra].join('|')})`
}

/**
 * The folder rules of the slices of one layer of a module: features or widgets, a slice for each
 * folder on disk.
 * @param {string} moduleName
 * @param {'features' | 'widgets'} layer
 * @returns {[string, string][]}
 */
function sliceFolderRulesOfLayer(moduleName, layer) {
  return foldersOf(`src/modules/${moduleName}/${layer}`).map((sliceName) => [
    `src/modules/${moduleName}/${layer}/${sliceName}/*/`,
    sliceFolderNames(layer),
  ])
}

/**
 * The folder rules of one module: its layers, the entities and the slices of its features and its
 * widgets.
 * @param {string} moduleName
 * @returns {[string, string][]}
 */
function folderRulesOfModule(moduleName) {
  return [
    [`src/modules/${moduleName}/*/`, `@(${moduleLayers.join('|')})`],
    [`src/modules/${moduleName}/entities/*/`, sliceFolderNames('entities')],
    ...sliceFolderRulesOfLayer(moduleName, 'features'),
    ...sliceFolderRulesOfLayer(moduleName, 'widgets'),
  ]
}

/**
 * The names of the folders of the modules, for the rule of check-file. The plugin checks every
 * folder that a wildcard of a glob matches, so each rule names its module and its slice and leaves
 * one wildcard, the last.
 * @returns {Record<string, string>}
 */
export function sliceFolderRules() {
  return Object.fromEntries(readModuleNames().flatMap(folderRulesOfModule))
}
