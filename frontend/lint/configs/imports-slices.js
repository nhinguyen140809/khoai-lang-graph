import { defineConfig } from 'eslint/config'

import { restrictImports } from '../lib/imports/restrict-imports.utils.js'
import { componentPaths, componentPatterns } from '../lib/imports/component-patterns.constants.js'
import { FileScope } from '../lib/imports/slice-patterns.constants.js'
import { modulePatterns } from '../lib/imports/slice-patterns.utils.js'
import { wrappedLibraryImports } from '../lib/imports/wrapped-libraries.constants.js'
import { moduleImports, moduleLayers } from '../lib/modules/module-imports.constants.js'
import { assertModuleTable, readModuleNames } from '../lib/modules/module-names.utils.js'
import localRules from '../plugin/index.js'

/** @import { FileScopeName } from '../lib/imports/slice-patterns.constants.js' */

/**
 * @typedef {object} Slice
 * @property {string} sliceGlob the glob of the slice folders
 * @property {(fileScope: FileScopeName) => object[]} patternsOf
 */

const moduleNames = readModuleNames()
assertModuleTable(moduleNames, moduleImports)

// The slices that share their rules: the entities of a module, its features and its widgets.
/** @type {Slice[]} */
const slices = moduleNames.flatMap((moduleName) =>
  moduleLayers.map((layer) => ({
    sliceGlob:
      layer === 'entities'
        ? `src/modules/${moduleName}/entities`
        : `src/modules/${moduleName}/${layer}/*`,
    patternsOf: (fileScope) => modulePatterns(moduleName, layer, fileScope),
  })),
)

// A later block replaces the whole rule, so each block repeats the patterns it keeps. A relative
// import that leaves its slice is the rule slice-boundary, which needs no block for each depth.
/** @param {Slice} slice */
function sourceBlock({ sliceGlob, patternsOf }) {
  return {
    files: [`${sliceGlob}/**/*.{ts,tsx}`],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: patternsOf(FileScope.Source),
    }),
  }
}

/** @param {Slice} slice */
function componentBlock({ sliceGlob, patternsOf }) {
  return {
    files: [`${sliceGlob}/components/**/*.{ts,tsx}`],
    ignores: ['**/__tests__/**'],
    rules: restrictImports({
      paths: componentPaths,
      patterns: [...patternsOf(FileScope.Source), ...componentPatterns],
    }),
  }
}

/** @param {Slice} slice */
function testBlock({ sliceGlob, patternsOf }) {
  return {
    files: [`${sliceGlob}/**/__tests__/*.{ts,tsx}`],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: patternsOf(FileScope.Test),
    }),
  }
}

// A slice imports only the layers under it and the modules under its module, other slices from
// their index, and its own files with relative imports. The blocks of a slice: its files, then
// the components, then the tests.
export default defineConfig([
  ...slices.flatMap((slice) => [sourceBlock(slice), componentBlock(slice), testBlock(slice)]),
  {
    files: ['src/modules/**/*.{ts,tsx}'],
    plugins: { local: /** @type {import('eslint').ESLint.Plugin} */ (localRules) },
    rules: { 'local/slice-boundary': 'error' },
  },
])
