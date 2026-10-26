/**
 * A name is not made of the words that the app dropped for another: the option `retired` lists
 * each pair of words in camelCase order, such as `["sign", "in"]`, with the word to use.
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
    const retired = context.options[0]?.retired ?? []
    return {
      Identifier(node) {
        const words = node.name.split(/(?<=[a-z0-9])(?=[A-Z])|_/).map((word) => word.toLowerCase())
        for (const entry of retired) {
          const at = words.findIndex((_, index) =>
            entry.words.every((word, offset) => words[index + offset] === word),
          )
          if (at !== -1) {
            context.report({
              node,
              messageId: 'retired',
              data: { name: node.name, words: entry.words.join(' '), use: entry.use },
            })
          }
        }
      },
    }
  },
}
