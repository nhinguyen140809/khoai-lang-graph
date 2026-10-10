// Renders the database diagrams from the DBML schema: one SVG per table group, and
// one overview with every table. The schema file is only read, never written; the
// output folder holds nothing but the files this script writes.
//
// Usage, from this folder: pnpm install, then pnpm render.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser } from '@dbml/core'
import { instance } from '@viz-js/viz'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const schemaFile = path.join(repoRoot, 'docs', 'architecture', 'database.dbml')
const outputDir = path.join(repoRoot, 'docs', 'architecture', 'diagrams', 'database')

// Columns that record who made a change (created_*, updated_*, changed_*, deleted_*)
// reference users, runs and steps from most tables. Their lines are left out; the
// referenced table is still written in the row.
const ORIGIN_COLUMN = /^(created|updated|changed|deleted)_(by_user_id|run_id|step_id)$/

// Graphviz sizes every cell with the built-in metrics of Courier. Monospace fonts
// share about the same character width, so the text fits its cell whichever
// monospace font the viewer has; the SVG asks for the common ones.
const FONT = 'Courier'
const SVG_FONT_FAMILY = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono','DejaVu Sans Mono',monospace"
const ENUM_LINE_LENGTH = 56
// How Graphviz draws the lines of the group diagrams: 'spline' for curves,
// 'polyline' for straight segments. Both attach a line to its column.
const SPLINES = 'polyline'
const COLOR = {
  text: '#1f2933',
  muted: '#6b7280',
  header: '#1f3a5f',
  headerText: '#ffffff',
  rowAlt: '#f3f4f6',
  external: '#eef0f3',
  externalBorder: '#9ca3af',
  edge: '#4b5563',
  cluster: '#f8fafc',
  clusterBorder: '#cbd5e1',
  later: '#fef3c7',
}

function escapeHtml(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

// Joins the values into lines of at most ENUM_LINE_LENGTH characters.
function wrapValues(values) {
  const lines = ['']
  for (const value of values) {
    const last = lines[lines.length - 1]
    const next = last ? `${last}, ${value}` : value
    if (last && next.length > ENUM_LINE_LENGTH) {
      lines[lines.length - 1] = `${last},`
      lines.push(value)
    } else {
      lines[lines.length - 1] = next
    }
  }
  return lines.map(escapeHtml).join('<BR ALIGN="LEFT"/>') + '<BR ALIGN="LEFT"/>'
}

function quote(id) {
  return `"${id}"`
}

function loadModel() {
  const database = new Parser().parse(fs.readFileSync(schemaFile, 'utf8'), 'dbmlv2')
  const schema = database.schemas[0]
  const enums = new Map(schema.enums.map((e) => [e.name, e.values.map((v) => v.name)]))
  const groups = schema.tableGroups.map((g) => ({ name: g.name, tables: g.tables.map((t) => t.name) }))
  const groupOf = new Map(groups.flatMap((g) => g.tables.map((t) => [t, g.name])))

  const tables = new Map()
  for (const table of schema.tables) {
    const compositeKey = new Set(
      table.indexes.filter((i) => i.pk).flatMap((i) => i.columns.map((c) => c.value)),
    )
    tables.set(table.name, {
      name: table.name,
      group: groupOf.get(table.name) ?? null,
      later: (table.note ?? '').startsWith('Later phase'),
      columns: table.fields.map((field) => ({
        name: field.name,
        type: field.type.type_name,
        isEnum: enums.has(field.type.type_name),
        pk: field.pk || compositeKey.has(field.name),
        nullable: !field.pk && !compositeKey.has(field.name) && !field.not_null,
        unique: Boolean(field.unique),
        references: null,
      })),
    })
  }

  const links = []
  for (const ref of schema.refs) {
    // The endpoint on the many side holds the foreign key; in a one-to-one reference
    // it is the endpoint whose column is not the id it points at. A relation is
    // '1', '0..1', '*' or '0..*'.
    const [a, b] = ref.endpoints
    const isMany = (endpoint) => endpoint.relation.endsWith('*')
    let holder = isMany(a) ? a : isMany(b) ? b : null
    if (!holder) holder = a.fieldNames[0] === 'id' ? b : a
    const target = holder === a ? b : a
    const link = {
      from: holder.tableName,
      column: holder.fieldNames[0],
      to: target.tableName,
      oneToOne: !isMany(a) && !isMany(b),
    }
    const column = tables.get(link.from).columns.find((c) => c.name === link.column)
    column.references = link.to
    link.optional = column.nullable
    links.push(link)
  }
  return { tables, groups, enums, links }
}

function keyText(column) {
  const keys = []
  if (column.pk) keys.push('PK')
  if (column.unique) keys.push('UQ')
  if (column.references) keys.push(`FK ${column.references}`)
  return keys.join(' ')
}

function tableNode(table) {
  const title = table.later ? `${table.name} (Later)` : table.name
  const rows = table.columns.map((column, index) => {
    const background = index % 2 === 1 ? ` BGCOLOR="${COLOR.rowAlt}"` : ''
    const name = column.pk ? `<B>${escapeHtml(column.name)}</B>` : escapeHtml(column.name)
    const typeText = escapeHtml(column.type + (column.nullable ? '?' : ''))
    const type = column.isEnum ? `<I>${typeText}</I>` : typeText
    const keys = keyText(column)
    return (
      `<TR><TD ALIGN="LEFT"${background}>${name}</TD>` +
      `<TD ALIGN="LEFT"${background}><FONT COLOR="${COLOR.muted}">${type}</FONT></TD>` +
      `<TD PORT="r_${column.name}" ALIGN="LEFT"${background}>${keys ? `<FONT COLOR="${COLOR.muted}">${escapeHtml(keys)}</FONT>` : ''}</TD></TR>`
    )
  })
  const header = table.later ? COLOR.later : COLOR.header
  const headerText = table.later ? COLOR.text : COLOR.headerText
  const label =
    `<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" COLOR="${COLOR.header}" BGCOLOR="#ffffff">` +
    `<TR><TD COLSPAN="3" BGCOLOR="${header}"><FONT COLOR="${headerText}"><B>${escapeHtml(title)}</B></FONT></TD></TR>` +
    rows.join('') +
    `</TABLE>`
  return `${quote(table.name)} [shape=plain, label=<${label}>];`
}

function externalNode(table) {
  const label =
    `<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="6" STYLE="dashed" COLOR="${COLOR.externalBorder}" BGCOLOR="${COLOR.external}">` +
    `<TR><TD><B>${escapeHtml(table.name)}</B></TD></TR>` +
    `<TR><TD><FONT POINT-SIZE="10" COLOR="${COLOR.muted}">${escapeHtml(table.group ?? 'no group')}</FONT></TD></TR>` +
    `</TABLE>`
  return `${quote(table.name)} [shape=plain, label=<${label}>];`
}

function enumNode(id, names, enums) {
  const rows = names.map(
    (name) =>
      `<TR><TD ALIGN="LEFT"><I>${escapeHtml(name)}</I></TD>` +
      `<TD ALIGN="LEFT" BALIGN="LEFT"><FONT COLOR="${COLOR.muted}">${wrapValues(enums.get(name))}</FONT></TD></TR>`,
  )
  const label =
    `<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" COLOR="${COLOR.externalBorder}" BGCOLOR="#ffffff">` +
    `<TR><TD COLSPAN="2" BGCOLOR="${COLOR.external}"><B>Enums</B></TD></TR>` +
    rows.join('') +
    `</TABLE>`
  return `${quote(id)} [shape=plain, label=<${label}>];`
}

// Crow's foot ends, with the same count written next to each end. At the foreign key
// end: many rows (*), or at most one (0..1) in a one-to-one reference. At the
// referenced end: exactly one (1) when the foreign key is NOT NULL, otherwise zero
// or one (0..1). A bar means one, a circle means zero is allowed, a crow's foot
// means many. A line starts at the row of its foreign key and ends at the border of
// the referenced table, since every foreign key points at the id of its table; lines
// into one table then reach it at different points instead of one row.
function edge(link) {
  const tail = `${quote(link.from)}:${quote(`r_${link.column}`)}:e`
  const head = quote(link.to)
  const tailShape = link.oneToOne ? 'teeodot' : 'crowodot'
  const tailCount = link.oneToOne ? '0..1' : '*'
  const headShape = link.optional ? 'teeodot' : 'teetee'
  const headCount = link.optional ? '0..1' : '1'
  return (
    `${tail} -> ${head} [dir=both, arrowtail=${tailShape}, arrowhead=${headShape}, ` +
    `taillabel="${tailCount}", headlabel="${headCount}"];`
  )
}

function graph(body, attributes) {
  return [
    'digraph database {',
    `  graph [fontname="${FONT}", fontsize=14, fontcolor="${COLOR.text}", bgcolor="#ffffff", pad=0.3, ${attributes}];`,
    `  node [fontname="${FONT}", fontsize=12, fontcolor="${COLOR.text}"];`,
    `  edge [color="${COLOR.edge}", penwidth=1.2, arrowsize=1.1, fontname="${FONT}", labelfontsize=11, labelfontcolor="${COLOR.header}", labeldistance=2, labelangle=25];`,
    ...body.map((line) => `  ${line}`),
    '}',
  ].join('\n')
}

// One table group: its tables in full, the tables they reference in other groups as
// dashed boxes, a line for every foreign key held by the group's tables except the
// origin columns, and the values of the enums its tables use.
function groupDiagram(model, group) {
  const members = new Set(group.tables)
  const links = model.links.filter((l) => members.has(l.from) && !ORIGIN_COLUMN.test(l.column))
  const externals = [...new Set(links.map((l) => l.to).filter((t) => !members.has(t)))]
  const enumNames = [
    ...new Set(group.tables.flatMap((t) => model.tables.get(t).columns.filter((c) => c.isEnum).map((c) => c.type))),
  ]
  const body = [
    ...group.tables.map((t) => tableNode(model.tables.get(t))),
    ...externals.map((t) => externalNode(model.tables.get(t))),
    ...(enumNames.length ? [enumNode(`${group.name}_enums`, enumNames, model.enums)] : []),
    ...links.map((l) => edge(l)),
  ]
  return graph(body, `rankdir=LR, nodesep=0.35, ranksep=1.1, splines=${SPLINES}, label="${group.name}", labelloc=t`)
}

// One box per table group listing its tables, and one line from a group to each
// other group that its tables reference, labelled with the number of foreign keys
// outside the origin columns. The lines between tables are in the group diagrams.
function overviewDiagram(model) {
  const groupOf = (table) => model.tables.get(table).group
  const counts = new Map()
  for (const link of model.links) {
    if (ORIGIN_COLUMN.test(link.column)) continue
    const from = groupOf(link.from)
    const to = groupOf(link.to)
    if (from === to) continue
    const key = `${from}->${to}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const body = model.groups.map((group) => {
    const rows = group.tables.map((name) => {
      const table = model.tables.get(name)
      const background = table.later ? ` BGCOLOR="${COLOR.later}"` : ''
      const title = table.later ? `${name} (Later)` : name
      return `<TR><TD ALIGN="LEFT"${background}>${escapeHtml(title)}</TD></TR>`
    })
    const label =
      `<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" COLOR="${COLOR.header}" BGCOLOR="#ffffff">` +
      `<TR><TD BGCOLOR="${COLOR.header}"><FONT COLOR="${COLOR.headerText}"><B>${escapeHtml(group.name)}</B></FONT></TD></TR>` +
      rows.join('') +
      `</TABLE>`
    return `${quote(group.name)} [shape=plain, label=<${label}>];`
  })
  for (const [key, count] of counts) {
    const [from, to] = key.split('->')
    const text = count === 1 ? '1 FK' : `${count} FKs`
    body.push(`${quote(from)} -> ${quote(to)} [label=" ${text} ", fontsize=11, fontcolor="${COLOR.header}", arrowhead=normal];`)
  }
  return graph(body, 'rankdir=LR, nodesep=0.6, ranksep=1.4, splines=spline, label="database overview", labelloc=t')
}

async function main() {
  const model = loadModel()
  const viz = await instance()
  const outputs = [
    ['overview.svg', overviewDiagram(model)],
    ...model.groups.map((g) => [`${g.name.replaceAll('_', '-')}.svg`, groupDiagram(model, g)]),
  ]
  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })
  for (const [file, dot] of outputs) {
    const result = viz.render(dot, { format: 'svg', engine: 'dot' })
    const errors = result.errors.filter((e) => e.level === 'error')
    if (result.status !== 'success' || errors.length) {
      throw new Error(`${file}: ${errors.map((e) => e.message.trim()).join(' ')}`)
    }
    for (const warning of result.errors) console.warn(`${file}: ${warning.message.trim()}`)
    const svg = result.output.replaceAll(`font-family="${FONT},monospace"`, `font-family="${SVG_FONT_FAMILY}"`)
    fs.writeFileSync(path.join(outputDir, file), svg)
    console.log(`wrote ${path.relative(repoRoot, path.join(outputDir, file))}`)
  }
}

await main()
