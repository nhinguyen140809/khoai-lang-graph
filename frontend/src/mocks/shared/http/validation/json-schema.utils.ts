import type { FieldProblem } from '@/shared/api/error'
import { isRecord, isString } from '@/shared/lib/guards'

// A check of a value against a JSON schema, for the keywords that the content schemas use: `type`,
// `enum`, `properties`, `required`, `additionalProperties`, `items`, `minItems`, `minimum` and
// `maximum`. It is written apart from the rules of the forms, so that the mock does not repeat a
// mistake of the web app.

function isValueOfJsonType(type: unknown, value: unknown): boolean {
  switch (type) {
    case 'string':
      return isString(value)
    case 'number':
      return typeof value === 'number'
    case 'integer':
      return Number.isInteger(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return isRecord(value)
    case 'null':
      return value === null
    default:
      return true
  }
}

/** The problems of a value against a schema, each at its path, such as `content.tags.0`. */
export function schemaProblems(schema: unknown, value: unknown, path: string): FieldProblem[] {
  if (!isRecord(schema)) return []
  const types = [schema.type].flat().filter(isString)
  if (types.length > 0 && !types.some((type) => isValueOfJsonType(type, value))) {
    return [{ field: path, message: `Send a value of type ${types.join(' or ')}.` }]
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    return [{ field: path, message: 'Choose one of the values.' }]
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      return [{ field: path, message: `Send ${String(schema.minimum)} or more.` }]
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      return [{ field: path, message: `Send ${String(schema.maximum)} or less.` }]
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      return [{ field: path, message: `Send at least ${String(schema.minItems)} entries.` }]
    }
    return value.flatMap((entry, index) =>
      schemaProblems(schema.items, entry, `${path}.${String(index)}`),
    )
  }
  if (isRecord(value)) return recordProblems(schema, value, path)
  return []
}

/**
 * The problems of the body of a request against a schema, each at the name of its field, such as
 * `default_run_config.max_steps`, without the dot that `schemaProblems` puts before a name.
 */
export function bodyProblems(schema: unknown, body: Record<string, unknown>): FieldProblem[] {
  return schemaProblems(schema, body, '').map((problem) => ({
    ...problem,
    field: problem.field.replace(/^\./, ''),
  }))
}

function recordProblems(
  schema: Record<string, unknown>,
  value: Record<string, unknown>,
  path: string,
): FieldProblem[] {
  const properties = isRecord(schema.properties) ? schema.properties : {}
  const required = Array.isArray(schema.required) ? schema.required : []
  const missing = required
    .filter(isString)
    .filter((name) => !(name in value))
    .map((name) => ({ field: `${path}.${name}`, message: 'This field is required.' }))
  const unknown =
    schema.additionalProperties === false
      ? Object.keys(value)
          .filter((name) => !(name in properties))
          .map((name) => ({ field: `${path}.${name}`, message: 'This field is not allowed.' }))
      : []
  const known = Object.entries(properties).flatMap(([name, property]) =>
    name in value ? schemaProblems(property, value[name], `${path}.${name}`) : [],
  )
  return [...missing, ...unknown, ...known]
}
