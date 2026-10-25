// Turns the coverage summary that `pnpm test:coverage` writes into a Markdown table, for the job
// summary and the comment of a pull request: the coverage of the whole project, then of each
// module and each folder of src/shared. It reports and never fails; the project has no minimum.
//
// Usage: node scripts/coverage-report.mjs [path of coverage-summary.json]
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const summaryPath = process.argv[2] ?? path.join(root, 'coverage', 'coverage-summary.json')

if (!existsSync(summaryPath)) {
  console.error(`No coverage summary at ${summaryPath}. Run pnpm test:coverage first.`)
  process.exit(1)
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'))
const metrics = ['lines', 'functions', 'branches', 'statements']

// The part of src/ that a file belongs to: a module, or a folder of src/shared.
function areaOf(file) {
  const parts = path.relative(root, file).split(path.sep)
  if (parts[0] !== 'src') return 'other'
  if (parts[1] === 'modules' || parts[1] === 'shared') return `${parts[1]}/${parts[2] ?? ''}`
  return parts[1] ?? 'src'
}

const areas = new Map()
for (const [file, entry] of Object.entries(summary)) {
  if (file === 'total') continue
  const area = areaOf(file)
  const sum = areas.get(area) ?? Object.fromEntries(metrics.map((name) => [name, [0, 0]]))
  for (const name of metrics) {
    sum[name][0] += entry[name].covered
    sum[name][1] += entry[name].total
  }
  areas.set(area, sum)
}

function percent([covered, total]) {
  return total === 0 ? '-' : `${((covered / total) * 100).toFixed(1)}%`
}

function row(label, values) {
  return `| ${label} | ${metrics.map((name) => percent(values[name])).join(' | ')} |`
}

const total = Object.fromEntries(
  metrics.map((name) => [name, [summary.total[name].covered, summary.total[name].total]]),
)
const lines = [
  // Lets the workflow find its comment on a pull request and update it instead of adding another.
  '<!-- coverage-report -->',
  '### Unit test coverage',
  '',
  `| Area | ${metrics.join(' | ')} |`,
  `|---|${metrics.map(() => '---:').join('|')}|`,
  row('**All of src**', total),
  ...[...areas.keys()].sort().map((area) => row(`\`${area}\``, areas.get(area))),
  '',
  'The report only informs: no minimum is checked.',
]
console.log(lines.join('\n'))
