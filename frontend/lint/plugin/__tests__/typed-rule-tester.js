import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, it } from 'vitest'

import { frontendRoot } from '../../lib/paths.utils.js'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

/** A RuleTester for the rules that read plain syntax. */
export function createRuleTester() {
  return new RuleTester()
}

/** A RuleTester that parses TypeScript with type information, for the rules that read types. */
export function createTypedRuleTester() {
  return new RuleTester({
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: { allowDefaultProject: ['*.ts'] },
        tsconfigRootDir: frontendRoot,
      },
    },
  })
}
