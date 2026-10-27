import { syntaxGroups } from './syntax-groups.constants.js'

/** @typedef {keyof typeof syntaxGroups} SyntaxGroup */

/** @param {string[]} groupNames */
function assertGroupsExist(groupNames) {
  for (const groupName of groupNames) {
    if (!(groupName in syntaxGroups)) throw new Error(`Unknown group of syntax: ${groupName}.`)
  }
}

/**
 * The groups of a list without the ones named, so that a block says what it leaves out of the
 * groups of every file instead of listing the rest again.
 * @param {SyntaxGroup[]} groupNames
 * @param {...SyntaxGroup} omitted
 * @returns {SyntaxGroup[]}
 */
export function withoutGroups(groupNames, ...omitted) {
  assertGroupsExist(omitted)
  return groupNames.filter((groupName) => !omitted.includes(groupName))
}

/**
 * The no-restricted-syntax rule with the selectors of the groups.
 * @param {...SyntaxGroup} groupNames
 * @returns {{ 'no-restricted-syntax': ['error', ...object[]] }}
 */
export function restrictSyntax(...groupNames) {
  assertGroupsExist(groupNames)
  return {
    'no-restricted-syntax': [
      'error',
      ...groupNames.flatMap((groupName) => syntaxGroups[groupName]),
    ],
  }
}
