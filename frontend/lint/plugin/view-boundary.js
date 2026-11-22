import { viewTag } from '../lib/imports/view-tag.constants.js'
import { isView, viewOfFile } from '../lib/imports/view-tag.utils.js'

/** @import { AstNode } from './typed-rule.utils.js' */
import { findTypeChecker } from './typed-rule.utils.js'

/**
 * A page of a view imports what is shared, and what is marked for its own view in the doc comment
 * of its declaration (`@view user`, `@view developer`); what is marked for the other view is
 * placed by the pages of that view only. The tag is read where the name is declared, through the
 * index files that give it again, so a new component says for itself which view it is for.
 * @type {import('eslint').Rule.RuleModule}
 */
export const viewBoundary = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      otherView:
        '{{name}} is for the {{tagged}} view (@view {{tagged}}) and this page is of the {{own}} view: the pages of each view place their own frame and slices (CONTRIBUTING: Areas of the app).',
      unknownView:
        '{{name}} has the tag @view {{value}}, which is not a view: use user or developer.',
    },
  },
  create(context) {
    const own = viewOfFile(context.filename)
    const typed = findTypeChecker(context)
    if (own === undefined || typed === undefined) return {}
    const { checker } = typed
    const services = /** @type {any} */ (context.sourceCode.parserServices)

    /**
     * The value of the @view tag of what an import names, or undefined without one.
     * @param {AstNode} specifier
     */
    function viewTagOf(specifier) {
      const tsNode = services.esTreeNodeToTSNodeMap.get(specifier)
      const imported = tsNode?.propertyName ?? tsNode?.name
      const symbol = imported === undefined ? undefined : checker.getSymbolAtLocation(imported)
      if (symbol === undefined) return undefined
      // A flag of the alias kind: the name is given again by an index, so follow it to its declaration.
      const declared = symbol.flags & 2097152 ? checker.getAliasedSymbol(symbol) : symbol
      const tag = declared.getJsDocTags(checker).find(({ name }) => name === viewTag)
      return tag?.text
        ?.map(({ text }) => text)
        .join('')
        .trim()
        .split(/\s+/)[0]
    }

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier' && specifier.type !== 'ImportDefaultSpecifier')
            continue
          const value = viewTagOf(specifier)
          if (value === undefined) continue
          const name = specifier.local.name
          if (!isView(value)) {
            context.report({ node: specifier, messageId: 'unknownView', data: { name, value } })
          } else if (value !== own) {
            context.report({
              node: specifier,
              messageId: 'otherView',
              data: { name, tagged: value, own },
            })
          }
        }
      },
    }
  },
}
