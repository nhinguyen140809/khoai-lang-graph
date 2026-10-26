import ts from 'typescript'

/**
 * A node of the syntax tree. The rules of plugin/ read the TypeScript nodes that typescript-eslint
 * adds to the ones in the types of ESLint, so a node here is typed loosely.
 * @typedef {any} AstNode
 */
/** @typedef {import('eslint').Rule.RuleContext} RuleContext */
/** @typedef {import('typescript').TypeChecker} TypeChecker */
/** @typedef {import('typescript').Type} Type */

/**
 * The type checker of a rule that needs type information, or undefined without it.
 * @param {RuleContext} context
 * @returns {{ checker: TypeChecker, typeOf: (node: AstNode) => Type } | undefined}
 */
export function findTypeChecker(context) {
  const services = /** @type {any} */ (context.sourceCode.parserServices)
  if (services?.program == null) return undefined
  const checker = /** @type {TypeChecker} */ (services.program.getTypeChecker())
  return {
    checker,
    typeOf: (node) => checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node)),
  }
}

/** @param {AstNode | null | undefined} node */
export function isFunctionNode(node) {
  return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression'
}

/**
 * The members of a union, or the type itself.
 * @param {Type} type
 */
export function membersOf(type) {
  return type.isUnion() ? type.types : [type]
}

/**
 * The type that a promise settles with, or the type itself.
 * @param {TypeChecker} checker
 * @param {Type} type
 */
export function awaitedTypeOf(checker, type) {
  return checker.getAwaitedType(type) ?? type
}

/**
 * Whether the type is a boolean. A flag may be absent (`boolean | undefined`), which `allowEmpty`
 * accepts; a function that gives back a boolean or nothing reads a value, it does not answer yes
 * or no.
 * @param {Type} type
 * @param {{ allowEmpty: boolean }} options
 */
export function isBooleanType(type, { allowEmpty }) {
  const members = membersOf(type)
  /** @param {Type} member */
  const isEmpty = (member) => (member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0
  const answers = members.filter((member) => !isEmpty(member))
  if (!allowEmpty && answers.length !== members.length) return false
  return (
    answers.length > 0 && answers.every((member) => (member.flags & ts.TypeFlags.BooleanLike) !== 0)
  )
}

/**
 * Whether the type may be null or undefined.
 * @param {Type} type
 */
export function isNullableType(type) {
  return membersOf(type).some(
    (member) => (member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0,
  )
}
