import ts from 'typescript'

/** @import { AstNode, Type, TypeChecker } from './typed-rule.utils.js' */
import {
  awaitedTypeOf,
  findTypeChecker,
  isFunctionNode,
  isNullableType,
} from './typed-rule.utils.js'

/**
 * What the type of the value that a function gives back is, or undefined when it says nothing.
 * @param {TypeChecker} checker
 * @param {Type} type
 */
function resultOf(checker, type) {
  const result = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0]?.getReturnType()
  if (result === undefined) return undefined
  const awaited = awaitedTypeOf(checker, result)
  return (awaited.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Void)) !== 0
    ? undefined
    : awaited
}

/**
 * 'find' or 'get' for a name that starts with one of them as a word, otherwise null.
 * @param {string} name
 */
function lookupVerbOf(name) {
  if (/^find[A-Z]/.test(name)) return 'find'
  if (/^get[A-Z]/.test(name)) return 'get'
  return null
}

/**
 * `find...` may come back empty, so it returns null or undefined when nothing matches; `get...`
 * always gives a value, and throws when it cannot.
 * @type {import('eslint').Rule.RuleModule}
 */
export const findGetName = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      find: '{{name}} never comes back empty: name it get... (it returns a value or throws), or let it return null or undefined (CONTRIBUTING: Names).',
      get: '{{name}} can come back empty: name it find... (CONTRIBUTING: Names).',
    },
  },
  create(context) {
    const typed = findTypeChecker(context)
    if (typed === undefined) return {}
    const { checker, typeOf } = typed

    /**
     * @param {AstNode} functionNode
     * @param {AstNode} id
     */
    function check(functionNode, id) {
      const verb = lookupVerbOf(id.name)
      if (verb === null) return
      const result = resultOf(checker, typeOf(functionNode))
      if (result === undefined) return
      const comesBackEmpty = isNullableType(result)
      if (verb === 'find' && !comesBackEmpty) {
        context.report({ node: id, messageId: 'find', data: { name: id.name } })
      }
      if (verb === 'get' && comesBackEmpty) {
        context.report({ node: id, messageId: 'get', data: { name: id.name } })
      }
    }

    return {
      /** @param {AstNode} node */
      FunctionDeclaration(node) {
        if (node.id) check(node, node.id)
      },
      /** @param {AstNode} node */
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && isFunctionNode(node.init)) check(node.init, node.id)
      },
    }
  },
}
