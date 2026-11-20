import { expectSteps } from '../expect-steps.js'
import { createTypedRuleTester } from './typed-rule-tester.js'

createTypedRuleTester().run('expect-steps', expectSteps, {
  valid: [
    { code: "expectText('Saved.')", filename: 'file.test.ts' },
    { code: "expectNoText('Failed to load.')", filename: 'file.test.ts' },
    { code: "expectRole('button', 'Save')", filename: 'file.test.ts' },
    { code: "expect(tooltip).toHaveTextContent('Link to another item')", filename: 'file.test.ts' },
    {
      code: "expect(within(dialog).getByText('Name')).toBeInTheDocument()",
      filename: 'file.test.ts',
    },
    { code: 'expect(bar).toBeInTheDocument()', filename: 'file.test.ts' },
    { code: "expect(screen.getByText('Name')).toBeVisible()", filename: 'file.test.ts' },
    { code: "expect(screen.queryByLabelText('Name')).toBeNull()", filename: 'file.test.ts' },
  ],
  invalid: [
    {
      code: "expect(screen.getByText('Name')).toBeInTheDocument()",
      filename: 'file.test.ts',
      errors: [{ messageId: 'text' }],
    },
    {
      code: "expect(await screen.findByText('Name')).toBeInTheDocument()",
      filename: 'file.test.ts',
      errors: [{ messageId: 'text' }],
    },
    {
      code: "expect(screen.queryByText('Failed')).not.toBeInTheDocument()",
      filename: 'file.test.ts',
      errors: [{ messageId: 'text' }],
    },
    {
      code: "expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument()",
      filename: 'file.test.ts',
      errors: [{ messageId: 'role' }],
    },
    {
      code: "expect(screen.queryByRole('alert')).not.toBeInTheDocument()",
      filename: 'file.test.ts',
      errors: [{ messageId: 'role' }],
    },
  ],
})
