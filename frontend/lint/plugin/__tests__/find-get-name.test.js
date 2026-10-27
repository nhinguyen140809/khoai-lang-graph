import { findGetName } from '../find-get-name.js'
import { createTypedRuleTester } from './typed-rule-tester.js'

createTypedRuleTester().run('find-get-name', findGetName, {
  valid: [
    { code: 'const findItem = (id: string) => (id ? id : null)', filename: 'file.ts' },
    { code: 'const getItem = (id: string) => id', filename: 'file.ts' },
    {
      code: 'const findItem = async (id: string): Promise<string | undefined> => id',
      filename: 'file.ts',
    },
    { code: 'const getter = () => null', filename: 'file.ts' },
    { code: 'const findings = () => 1', filename: 'file.ts' },
  ],
  invalid: [
    {
      code: 'const findItem = (id: string) => id',
      filename: 'file.ts',
      errors: [{ messageId: 'find' }],
    },
    {
      code: 'function getItem(id: string) { return id || null }',
      filename: 'file.ts',
      errors: [{ messageId: 'get' }],
    },
  ],
})
