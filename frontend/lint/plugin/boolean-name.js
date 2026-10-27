import ts from 'typescript'

/** @import { AstNode, Type, TypeChecker } from './typed-rule.utils.js' */
import {
  awaitedTypeOf,
  findTypeChecker,
  isBooleanType,
  isFunctionNode,
} from './typed-rule.utils.js'

const allowedName = /^(is|has|can)[A-Z0-9]/
// A hook is useSomething; a name such as user or used is not a hook.
const hookName = /^use[A-Z0-9]/

/**
 * @param {TypeChecker} checker
 * @param {Type} type
 */
function isBooleanFunction(checker, type) {
  return checker.getSignaturesOfType(type, ts.SignatureKind.Call).some((signature) => {
    if (checker.getTypePredicateOfSignature(signature) !== undefined) return true
    return isBooleanType(awaitedTypeOf(checker, checker.getReturnTypeOfSignature(signature)), {
      allowEmpty: false,
    })
  })
}

/**
 * A function that returns a boolean, and a variable or a parameter that holds one, is named
 * `is...`, `has...` or `can...`. A hook is named `use...`; a destructured name keeps the name of
 * the field it takes, and a callback written in place takes the name of its caller.
 * @type {import('eslint').Rule.RuleModule}
 */
export const booleanName = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      name: '{{name}} is a boolean (or returns one): name it is..., has... or can... (CONTRIBUTING: Names).',
    },
  },
  create(context) {
    const typed = findTypeChecker(context)
    if (typed === undefined) return {}
    const { checker, typeOf } = typed

    /** @param {AstNode} id */
    function report(id) {
      context.report({ node: id, messageId: 'name', data: { name: id.name } })
    }

    /** @param {string} name */
    function isNamedWell(name) {
      return name.startsWith('_') || hookName.test(name) || allowedName.test(name)
    }

    /** @param {AstNode} functionNode */
    function checkParameters(functionNode) {
      for (const parameter of functionNode.params) {
        const id = parameter.type === 'AssignmentPattern' ? parameter.left : parameter
        if (id.type !== 'Identifier' || isNamedWell(id.name)) continue
        if (isBooleanType(typeOf(id), { allowEmpty: true })) report(id)
      }
    }

    return {
      /** @param {AstNode} node */
      FunctionDeclaration(node) {
        checkParameters(node)
        if (node.id && !isNamedWell(node.id.name) && isBooleanFunction(checker, typeOf(node))) {
          report(node.id)
        }
      },
      /** @param {AstNode} node */
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || isNamedWell(node.id.name)) return
        if (isFunctionNode(node.init)) {
          checkParameters(node.init)
          if (isBooleanFunction(checker, typeOf(node.init))) report(node.id)
        } else if (isBooleanType(typeOf(node.id), { allowEmpty: true })) {
          report(node.id)
        }
      },
    }
  },
}
