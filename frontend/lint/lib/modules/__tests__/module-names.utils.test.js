import { describe, expect, it } from 'vitest'

import { moduleImports } from '../module-imports.constants.js'
import {
  assertModuleOrder,
  assertModulesListed,
  assertModuleTable,
  readModuleNames,
} from '../module-names.utils.js'

describe('moduleImports', () => {
  it('lists every module on disk and has no cycle', () => {
    expect(() => {
      assertModuleTable(readModuleNames(), moduleImports)
    }).not.toThrow()
  })
})

describe('assertModuleOrder', () => {
  it('reports the cycle of two modules that import each other', () => {
    expect(() => {
      assertModuleOrder({ a: ['b'], b: ['a'] })
    }).toThrow('a -> b -> a')
  })

  it('reports a module that a list names without giving it a list', () => {
    expect(() => {
      assertModuleOrder({ a: ['b'] })
    }).toThrow('a lists b')
  })

  it('accepts modules that share a module under them', () => {
    expect(() => {
      assertModuleOrder({ base: [], a: ['base'], b: ['base', 'a'] })
    }).not.toThrow()
  })
})

describe('assertModulesListed', () => {
  it('reports a module on disk that the table does not have', () => {
    expect(() => {
      assertModulesListed(['new-module'], { other: [] })
    }).toThrow('new-module')
  })
})
