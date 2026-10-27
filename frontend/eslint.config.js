import { defineConfig } from 'eslint/config'

import base from './lint/configs/base.js'
import environments from './lint/configs/environments.js'
import fileNames from './lint/configs/file-names.js'
import ignores from './lint/configs/ignores.js'
import importsE2e from './lint/configs/imports-e2e.js'
import importsMocks from './lint/configs/imports-mocks.js'
import importsPublicApi from './lint/configs/imports-public-api.js'
import importsShared from './lint/configs/imports-shared.js'
import importsSlices from './lint/configs/imports-slices.js'
import names from './lint/configs/names.js'
import restrictedAccess from './lint/configs/restricted-access.js'
import syntax from './lint/configs/syntax.js'
import uiComponents from './lint/configs/ui-components.js'

// The blocks are in `lint/configs/`, one file for each concern. A later block replaces the whole
// list of a rule such as no-restricted-imports for the files it matches, so the order below is
// part of the rules: do not reorder it.
export default defineConfig([
  ...ignores,
  ...base,
  ...importsPublicApi,
  ...restrictedAccess,
  ...names,
  ...syntax,
  ...importsShared,
  ...importsMocks,
  ...importsSlices,
  ...fileNames,
  ...uiComponents,
  ...importsE2e,
  ...environments,
])
