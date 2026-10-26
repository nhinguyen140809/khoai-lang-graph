import ts from 'typescript'

const allowedName = /^(is|has|can)[A-Z0-9]/

function isBooleanFunction(checker, type) {
  return checker.getSignaturesOfType(type, ts.SignatureKind.Call).some((signature) => {
    if (checker.getTypePredicateOfSignature(signature) !== undefined) return true
    return (checker.getReturnTypeOfSignature(signature).flags & ts.TypeFlags.BooleanLike) !== 0
  })
}

function isFunctionNode(node) {
  return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression'
}

/**
 * A function that returns a boolean, and a variable or a parameter that holds one, is named
 * `is...`, `has...` or `can...`. A hook is named `use...`; a destructured name keeps the name of
 * the field it takes, and a callback written in place takes the name of its caller.
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
    const services = context.sourceCode.parserServices
    if (services?.program == null) return {}
    const checker = services.program.getTypeChecker()

    function typeOf(node) {
      return checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node))
    }

    function report(id) {
      context.report({ node: id, messageId: 'name', data: { name: id.name } })
    }

    function isNamedWell(name) {
      return name.startsWith('_') || name.startsWith('use') || allowedName.test(name)
    }

    function checkParameters(fn) {
      for (const parameter of fn.params) {
        const id = parameter.type === 'AssignmentPattern' ? parameter.left : parameter
        if (id.type !== 'Identifier' || isNamedWell(id.name)) continue
        if ((typeOf(id).flags & ts.TypeFlags.BooleanLike) !== 0) report(id)
      }
    }

    return {
      FunctionDeclaration(node) {
        checkParameters(node)
        if (node.id && !isNamedWell(node.id.name) && isBooleanFunction(checker, typeOf(node))) {
          report(node.id)
        }
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || isNamedWell(node.id.name)) return
        if (isFunctionNode(node.init)) {
          checkParameters(node.init)
          if (isBooleanFunction(checker, typeOf(node.init))) report(node.id)
        } else if ((typeOf(node.id).flags & ts.TypeFlags.BooleanLike) !== 0) {
          report(node.id)
        }
      },
    }
  },
}
