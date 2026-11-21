/**
 * A unit test reads the screen through the expect* steps of the test helpers: a text with
 * expectText or expectNoText, a control of a role with expectRole or expectNoRole. A test that
 * runs under fake timers keeps its raw getBy*: the steps wait for what they read, and waiting
 * does not finish under fake timers (CONTRIBUTING: Fake timers).
 *
 * @import { AstNode } from './typed-rule.utils.js'
 * @type {import('eslint').Rule.RuleModule}
 */
export const expectSteps = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      text: 'Check a text with expectText or expectNoText of @/test/steps; under fake timers the steps hang, so getBy* stays (CONTRIBUTING: Fake timers).',
      role: 'Check a control with expectRole or expectNoRole of @/test/steps; under fake timers the steps hang, so getBy* stays (CONTRIBUTING: Fake timers).',
    },
  },
  create(context) {
    /**
     * The one word a member is read by, such as `queryByText` of `screen.queryByText`, or null
     * when it is not one.
     * @param {AstNode} member
     */
    function propertyNameOf(member) {
      return member.property.type === 'Identifier' ? member.property.name : null
    }

    /**
     * What the screen query in the expect reads, or null when there is none: `screen.getByText`
     * and the calls like it, with or without an await in front.
     * @param {AstNode} expectCall
     */
    function screenQueryOf(expectCall) {
      let argument = expectCall.arguments[0]
      if (argument === undefined) return null
      if (argument.type === 'AwaitExpression') argument = argument.argument
      if (argument.type !== 'CallExpression') return null
      const callee = argument.callee
      if (callee.type !== 'MemberExpression') return null
      if (callee.object.type !== 'Identifier' || callee.object.name !== 'screen') return null
      const name = propertyNameOf(callee)
      const match = name === null ? null : /^(?:get|find|query)By(Text|Role)$/.exec(name)
      return match === null ? null : { kind: match[1] === 'Text' ? 'text' : 'role' }
    }

    return {
      CallExpression(node) {
        const assert = node.callee
        if (assert.type !== 'MemberExpression') return
        if (propertyNameOf(assert) !== 'toBeInTheDocument') return
        let expectCall = assert.object
        if (expectCall.type === 'MemberExpression' && propertyNameOf(expectCall) === 'not') {
          expectCall = expectCall.object
        }
        if (expectCall.type !== 'CallExpression') return
        if (expectCall.callee.type !== 'Identifier' || expectCall.callee.name !== 'expect') return
        const query = screenQueryOf(expectCall)
        if (query !== null) context.report({ node, messageId: query.kind })
      },
    }
  },
}
