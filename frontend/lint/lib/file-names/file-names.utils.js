import { moduleLayers } from '../modules/module-imports.constants.js'
import { readModuleNames } from '../modules/module-names.utils.js'
import { foldersOf } from '../paths.utils.js'
import {
  fileKinds,
  kebabCasePattern,
  kindFolders,
  topicEntityModules,
} from './file-kinds.constants.js'

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
 * The folder rules of the entities of a module: a folder for each kind at the root, or, for a
 * module split by topic, a folder for each topic at the root, or for each group of topics that
 * holds its topic folders and its components, and a topic holds its components, hooks and tests
 * only.
 * @param {string} moduleName
 * @returns {[string, string][]}
 */
function entityFolderRules(moduleName) {
  const topicImports = topicEntityModules[moduleName]
  if (topicImports === undefined) {
    return [[`src/modules/${moduleName}/entities/*/`, sliceFolderNames('entities')]]
  }
  const topics = Object.keys(topicImports)
  // A topic named <group>/<name> sits in a folder of its group, which holds only topic folders.
  /** @type {Map<string, string[]>} */
  const groups = new Map()
  for (const topic of topics) {
    const [group, name] = topic.split('/')
    if (name !== undefined && group !== undefined)
      groups.set(group, [...(groups.get(group) ?? []), name])
  }
  const roots = [...new Set(topics.map((topic) => topic.split('/')[0]))]
  return [
    [`src/modules/${moduleName}/entities/*/`, `@(components|__tests__|@x|${roots.join('|')})`],
    ...[...groups].map(
      ([group, names]) =>
        /** @type {[string, string]} */ ([
          `src/modules/${moduleName}/entities/${group}/*/`,
          `@(components|${names.join('|')})`,
        ]),
    ),
    ...topics.map(
      (topic) =>
        /** @type {[string, string]} */ ([
          `src/modules/${moduleName}/entities/${topic}/*/`,
          '@(components|hooks|__tests__)',
        ]),
    ),
  ]
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
    ...entityFolderRules(moduleName),
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
