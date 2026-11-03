/** The ids that each id leads to. */
const chain: Record<string, string[]> = { a: ['b'], b: ['c', 'd'], c: ['e'], d: ['e'], e: [] }
const loop: Record<string, string[]> = { a: ['b'], b: ['c'], c: ['a'] }
const none: Record<string, string[]> = {}

/** A walk over some edges, and the steps from the starts to every id it reaches. */
export const distanceCases = [
  {
    name: 'a start with nothing after it is the only id',
    edges: chain,
    starts: ['e'],
    depth: null,
    expected: { e: 0 },
  },
  {
    name: 'every id after the start, each at its fewest steps',
    edges: chain,
    starts: ['a'],
    depth: null,
    expected: { a: 0, b: 1, c: 2, d: 2, e: 3 },
  },
  {
    name: 'only the ids within the depth',
    edges: chain,
    starts: ['a'],
    depth: 2,
    expected: { a: 0, b: 1, c: 2, d: 2 },
  },
  {
    name: 'a depth of zero is the starts alone',
    edges: chain,
    starts: ['a', 'e'],
    depth: 0,
    expected: { a: 0, e: 0 },
  },
  {
    name: 'several starts, each id at its nearest start',
    edges: chain,
    starts: ['a', 'c'],
    depth: null,
    expected: { a: 0, c: 0, b: 1, e: 1, d: 2 },
  },
  {
    name: 'a loop walked once',
    edges: loop,
    starts: ['a'],
    depth: null,
    expected: { a: 0, b: 1, c: 2 },
  },
  {
    name: 'an id that has no edges listed',
    edges: none,
    starts: ['x'],
    depth: null,
    expected: { x: 0 },
  },
]

const edgeList = [
  { from: 'a', to: 'b' },
  { from: 'a', to: 'c' },
  { from: 'b', to: 'c' },
]

/** Some edges, an id, and the ids that its edges lead to. */
export const edgeCases = [
  {
    name: 'the ends of the edges that leave an id, in order',
    edges: edgeList,
    id: 'a',
    expected: ['b', 'c'],
  },
  { name: 'nothing for an id with no edge leaving it', edges: edgeList, id: 'c', expected: [] },
  { name: 'nothing when there is no edge', edges: [], id: 'a', expected: [] },
]
