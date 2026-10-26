import ts from 'typescript'

function isNullable(type) {
  const parts = type.isUnion() ? type.types : [type]
  return parts.some((part) => (part.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0)
}

function resultOf(checker, type) {
  const result = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0]?.getReturnType()
  if (result === undefined) return undefined
  const awaited = checker.getAwaitedType(result) ?? result
  return (awaited.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Void)) !== 0
    ? undefined
    : awaited
}

/**
 * `find...` may come back empty, so it returns null or undefined when nothing matches; `get...`
 * always gives a value, and throws when it cannot.
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
    const services = context.sourceCode.parserServices
    if (services?.program == null) return {}
    const checker = services.program.getTypeChecker()

    function check(fnNode, id) {
      const kind = /^find[A-Z]/.test(id.name) ? 'find' : /^get[A-Z]/.test(id.name) ? 'get' : null
      if (kind === null) return
      const type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(fnNode))
      const result = resultOf(checker, type)
      if (result === undefined) return
      const empty = isNullable(result)
      if (kind === 'find' && !empty) {
        context.report({ node: id, messageId: 'find', data: { name: id.name } })
      }
      if (kind === 'get' && empty) {
        context.report({ node: id, messageId: 'get', data: { name: id.name } })
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) check(node, node.id)
      },
      VariableDeclarator(node) {
        const { init } = node
        if (
          node.id.type === 'Identifier' &&
          (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression')
        ) {
          check(init, node.id)
        }
      },
    }
  },
}
