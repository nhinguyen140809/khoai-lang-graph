import { foldersOf } from '../paths.utils.js'

/**
 * Every module on disk has its place in the table.
 * @param {string[]} moduleNamesOnDisk
 * @param {Record<string, string[]>} importsOf the table, as moduleImports
 */
export function assertModulesListed(moduleNamesOnDisk, importsOf) {
  for (const name of moduleNamesOnDisk) {
    if (!(name in importsOf)) {
      throw new Error(`Give the module ${name} its place in moduleImports.`)
    }
  }
}

/**
 * The rule of each module allows the modules of its list, so two lists that reach each other
 * would let two modules import each other. Following the lists from any module never comes back
 * to it, and every module that a list names has a list of its own.
 * @param {Record<string, string[]>} importsOf the table, as moduleImports
 */
export function assertModuleOrder(importsOf) {
  const checkedNames = new Set()

  /** @param {string} name @param {string[]} trail */
  function visit(name, trail) {
    if (trail.includes(name)) {
      const cycle = [...trail.slice(trail.indexOf(name)), name].join(' -> ')
      throw new Error(`moduleImports has a cycle: ${cycle}.`)
    }
    if (checkedNames.has(name)) return
    const allowedImports = importsOf[name]
    if (allowedImports === undefined) {
      throw new Error(`${String(trail.at(-1))} lists ${name}, which moduleImports does not have.`)
    }
    for (const imported of allowedImports) visit(imported, [...trail, name])
    checkedNames.add(name)
  }

  for (const name of Object.keys(importsOf)) visit(name, [])
}

/** The names of the folders of src/modules/. */
export function readModuleNames() {
  return foldersOf('src/modules')
}

/**
 * The checks of the table: it lists every module on disk, and its order has no cycle.
 * @param {string[]} moduleNamesOnDisk
 * @param {Record<string, string[]>} importsOf the table, as moduleImports
 */
export function assertModuleTable(moduleNamesOnDisk, importsOf) {
  assertModulesListed(moduleNamesOnDisk, importsOf)
  assertModuleOrder(importsOf)
}
