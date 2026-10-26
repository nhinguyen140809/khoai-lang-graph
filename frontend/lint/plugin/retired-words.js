/**
 * A name is not made of the words that the app dropped for another: the option `retired` lists
 * each pair of words in camelCase order, such as `["sign", "in"]`, with the word to use.
 * @type {import('eslint').Rule.RuleModule}
 */
export const retiredWords = {
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        properties: {
          retired: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                words: { type: 'array', items: { type: 'string' } },
                use: { type: 'string' },
              },
              required: ['words', 'use'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      retired: '{{name}} says "{{words}}": the app says "{{use}}" (CONTRIBUTING: Names).',
    },
  },
  create(context) {
    /** @type {{ words: string[], use: string }[]} */
    const retired = context.options[0]?.retired ?? []

    /** Reports the identifier that a declaration gives a name with a retired pair of words. */
    /** @param {import('./typed-rule.utils.js').AstNode} id */
    function checkDeclaredName(id) {
      if (id?.type !== 'Identifier') return
      /** @type {string[]} */
      const words = id.name
        .split(/(?<=[a-z0-9])(?=[A-Z])|_/)
        .map((/** @type {string} */ word) => word.toLowerCase())
      for (const entry of retired) {
        const hasWords = words.some((_, index) =>
          entry.words.every(
            (/** @type {string} */ word, /** @type {number} */ offset) =>
              words[index + offset] === word,
          ),
        )
        if (hasWords) {
          context.report({
            node: id,
            messageId: 'retired',
            data: { name: id.name, words: entry.words.join(' '), use: entry.use },
          })
        }
      }
    }

    // Only the names that the code gives: a use of a name from a library is not reported.
    return {
      /** @param {import('./typed-rule.utils.js').AstNode} node */
      VariableDeclarator: (node) => {
        checkDeclaredName(node.id)
      },
      FunctionDeclaration: (node) => {
        checkDeclaredName(node.id)
      },
      'FunctionDeclaration > Identifier.params, FunctionExpression > Identifier.params, ArrowFunctionExpression > Identifier.params':
        checkDeclaredName,
      'ObjectExpression > Property[computed=false] > Identifier.key': checkDeclaredName,
      'TSPropertySignature[computed=false] > Identifier.key': checkDeclaredName,
      'PropertyDefinition[computed=false] > Identifier.key': checkDeclaredName,
      'MethodDefinition[computed=false] > Identifier.key': checkDeclaredName,
      'ClassDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration, TSEnumDeclaration': (
        /** @type {import('./typed-rule.utils.js').AstNode} */ node,
      ) => {
        checkDeclaredName(node.id)
      },
    }
  },
}
