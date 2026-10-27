import { booleanName } from '../boolean-name.js'
import { createTypedRuleTester } from './typed-rule-tester.js'

createTypedRuleTester().run('boolean-name', booleanName, {
  valid: [
    { code: 'const isOpen = true', filename: 'file.ts' },
    { code: 'const hasItems = (items: string[]) => items.length > 0', filename: 'file.ts' },
    { code: 'function canEdit(): boolean { return true }', filename: 'file.ts' },
    { code: 'const useDarkMode = (): boolean => true', filename: 'file.ts' },
    { code: 'const user = { name: "a" }', filename: 'file.ts' },
    { code: 'const count = 3', filename: 'file.ts' },
    // a reader of a value gives a boolean or nothing; it does not answer yes or no
    {
      code: 'const readFlag = (value: unknown) => (typeof value === "boolean" ? value : undefined)',
      filename: 'file.ts',
    },
  ],
  invalid: [
    { code: 'const open = true', filename: 'file.ts', errors: [{ messageId: 'name' }] },
    { code: 'const used = true', filename: 'file.ts', errors: [{ messageId: 'name' }] },
    {
      code: 'declare const isMaybe: boolean | undefined; const enabled = isMaybe',
      filename: 'file.ts',
      errors: [{ messageId: 'name' }],
    },
    {
      code: 'function check(enabled?: boolean) { return enabled }',
      filename: 'file.ts',
      errors: [{ messageId: 'name' }],
    },
    {
      code: 'const exists = async (): Promise<boolean> => true',
      filename: 'file.ts',
      errors: [{ messageId: 'name' }],
    },
  ],
})
