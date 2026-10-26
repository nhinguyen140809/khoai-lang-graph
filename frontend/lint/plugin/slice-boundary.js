import path from 'node:path'

/** @import { AstNode } from './typed-rule.utils.js' */

// A slice folder: the entities of a module, or one feature or widget of a module.
const sliceFolderPattern =
  /^(.*[\\/]src[\\/]modules[\\/][^\\/]+[\\/](?:entities|(?:features|widgets)[\\/][^\\/]+))[\\/]/

/**
 * The folder of the slice that holds a file, or undefined for a file outside every slice.
 * @param {string} filename
 */
function findSliceFolder(filename) {
  return sliceFolderPattern.exec(filename)?.[1]
}

/**
 * @param {string} folder
 * @param {string} target
 */
function isInside(folder, target) {
  const relative = path.relative(folder, target)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * A relative import in a slice stays inside the folder of the slice. Another slice is imported
 * from its index, and shared code through the alias of the shared folder.
 * @type {import('eslint').Rule.RuleModule}
 */
export const sliceBoundary = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      leaves:
        'A relative import stays inside its slice. Import another slice from its index, and shared code with @/shared.',
    },
  },
  create(context) {
    const { filename } = context
    const sliceFolder = findSliceFolder(filename)
    if (sliceFolder === undefined) return {}

    /** @param {AstNode} node */
    const check = (node) => {
      const source = node.source?.value
      if (typeof source !== 'string' || !source.startsWith('.')) return
      const target = path.resolve(path.dirname(filename), source)
      if (!isInside(sliceFolder, target)) context.report({ node: node.source, messageId: 'leaves' })
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    }
  },
}
