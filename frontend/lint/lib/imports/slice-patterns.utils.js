import { moduleImports, moduleLayers } from '../modules/module-imports.constants.js'
import { nonEntityPublicApiPatterns, publicApiPatterns } from './public-api-patterns.constants.js'
import { outsideLayersPatterns } from './layer-patterns.constants.js'
import { messages } from './messages.constants.js'
/** @import { FileScopeName } from './slice-patterns.constants.js' */
import { FileScope } from './slice-patterns.constants.js'

/**
 * The layers above a layer are never imported from it.
 * @param {string} layer
 */
function layersAbovePatterns(layer) {
  const above = moduleLayers.slice(moduleLayers.indexOf(layer) + 1)
  if (above.length === 0) return []
  return [{ regex: `^@/modules/[^/]+/(${above.join('|')})(/|$)`, message: messages.layerOrder }]
}

/** @param {string} moduleName */
function modulesAbovePatterns(moduleName) {
  const importedModules = moduleImports[moduleName]
  if (importedModules === undefined) {
    throw new Error(`The module ${moduleName} has no list in moduleImports.`)
  }
  return [
    {
      regex: `^@/modules/(?!(${[moduleName, ...importedModules].join('|')})/)`,
      message: messages.moduleOrder,
    },
  ]
}

/**
 * The message for an entity that reaches another entity in a way the rule does not allow.
 * @param {string} moduleName
 */
function entityFileMessage(moduleName) {
  return `An entity imports another entity only through the file that the other gives it: @/modules/<module>/entities/@x/${moduleName}.`
}

/**
 * The code of an entity reaches another entity only through the @x file that the other gives to
 * its module, so even the index of another entity is out.
 * @param {string} moduleName
 */
function entitySourcePattern(moduleName) {
  return {
    regex: `^@/modules/[^/]+/entities(?!/@x/${moduleName}$)(/|$)`,
    message: entityFileMessage(moduleName),
  }
}

/**
 * A unit test of an entity may import the index of another entity, to show entities together; the
 * files inside another entity stay out, but for its @x file.
 * @param {string} moduleName
 */
function entityTestPattern(moduleName) {
  return {
    regex: `^@/modules/[^/]+/entities/(?!@x/${moduleName}$)`,
    message: entityFileMessage(moduleName),
  }
}

/**
 * @param {string} moduleName
 * @param {FileScopeName} fileScope
 */
function entityPatterns(moduleName, fileScope) {
  return [
    fileScope === FileScope.Test ? entityTestPattern(moduleName) : entitySourcePattern(moduleName),
    ...nonEntityPublicApiPatterns,
  ]
}

/**
 * A feature never imports another feature, nor a widget another widget; a unit test may.
 * @param {string} layer
 * @param {FileScopeName} fileScope
 */
function sameLayerPatterns(layer, fileScope) {
  if (fileScope === FileScope.Test) return []
  return [
    {
      regex: `^@/modules/[^/]+/${layer}(/|$)`,
      message:
        layer === 'features'
          ? 'A feature never imports another feature. Compose features in a widget or in src/app/, or move the code they share down a layer.'
          : 'A widget never imports another widget. Compose widgets in src/app/.',
    },
  ]
}

/**
 * The patterns of a file of a module: the layers above its own, the other slices of its layer, the
 * modules above its module, and the inside of every slice. A unit test may import another slice of
 * its layer, from its index, to show slices together.
 * @param {string} moduleName
 * @param {string} layer one of moduleLayers
 * @param {FileScopeName} fileScope
 */
export function modulePatterns(moduleName, layer, fileScope) {
  return [
    ...outsideLayersPatterns,
    ...layersAbovePatterns(layer),
    ...modulesAbovePatterns(moduleName),
    ...(layer === 'entities'
      ? entityPatterns(moduleName, fileScope)
      : [...sameLayerPatterns(layer, fileScope), ...publicApiPatterns]),
  ]
}
