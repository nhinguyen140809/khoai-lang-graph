import { defineConfig } from 'eslint/config'

import { nextRoutingFiles } from '../lib/next-routing-files.constants.js'
import { restrictSyntax, withoutGroups } from '../lib/syntax/restrict-syntax.utils.js'

// The groups that nearly every file of src/ follows, and the same with named exports only. Each
// block below adds the groups of its own place.
/** @type {import('../lib/syntax/restrict-syntax.utils.js').SyntaxGroup[]} */
const everyFile = [
  'persistStorage',
  'bracketClasses',
  'innerHtml',
  'inlineKeys',
  'routeCast',
  'httpVocabulary',
  'httpMethodLiteral',
  'apiPaths',
]
/** @type {import('../lib/syntax/restrict-syntax.utils.js').SyntaxGroup[]} */
const namedExports = [...everyFile, 'defaultExport']

export default defineConfig([
  // The groups of syntax that each place of src/ follows. The UI components, copied from
  // shadcn/ui, keep their classes in brackets and their hooks beside their components; a test
  // writes its keys and declares its hooks where it uses them.
  {
    files: ['src/**/*.ts'],
    rules: restrictSyntax(...namedExports),
  },
  {
    files: ['src/**/*.@(utils|lookup|changes|problems|validators|handlers).ts'],
    rules: restrictSyntax(...namedExports, 'exportedTypes'),
  },
  {
    // The utils files of the slices, whose helpers are pure; shared code and the test helpers wrap
    // the cache of the queries in utils files of their own.
    files: ['src/modules/**/*.utils.ts'],
    rules: restrictSyntax(...namedExports, 'exportedTypes', 'queriesInUtils'),
  },
  {
    files: ['src/**/*.constants.ts'],
    rules: restrictSyntax(...namedExports, 'valuesInConstants'),
  },
  {
    files: ['src/**/*.types.ts'],
    rules: restrictSyntax(...namedExports, 'constantsInTypes'),
  },
  {
    files: ['src/**/*.tsx'],
    rules: restrictSyntax(...namedExports, 'hooksInComponents', 'destructiveActions'),
  },
  {
    // The dialogs that ask before a destructive action are the components that call it.
    files: ['src/**/*Dialog.tsx'],
    rules: restrictSyntax(...namedExports, 'hooksInComponents'),
  },
  {
    files: ['src/**/__tests__/**/*.{ts,tsx}'],
    rules: restrictSyntax(
      ...withoutGroups(everyFile, 'inlineKeys', 'routeCast', 'httpMethodLiteral'),
      'defaultExport',
      'userEventKeys',
      'testQueryClient',
    ),
  },
  {
    // The test of the endpoints writes the paths that they must give.
    files: ['src/shared/api/endpoints/__tests__/**/*.ts'],
    rules: restrictSyntax('persistStorage', 'bracketClasses', 'innerHtml', 'defaultExport'),
  },
  {
    // The names of HTTP are written out here.
    files: ['src/shared/api/http/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: restrictSyntax('persistStorage', 'innerHtml', 'inlineKeys', 'defaultExport'),
  },
  {
    // The charts of shadcn/ui write the CSS variables of their colors into a style element.
    files: ['src/shared/components/ui/chart.tsx'],
    rules: restrictSyntax('persistStorage', 'inlineKeys', 'defaultExport'),
  },
  {
    // The routing files of Next.js are the only files with a default export.
    files: nextRoutingFiles,
    rules: restrictSyntax(...everyFile, 'hooksInComponents'),
  },
  {
    // The one place that casts an address to Route.
    files: ['src/shared/routes/typed-route/typed-route.utils.ts'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'defaultExport',
      'exportedTypes',
    ),
  },
])
