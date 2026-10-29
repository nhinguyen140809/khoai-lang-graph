/** A stage whose parent is `parent`, for building a definition with stages in a tree. */
function stage(key: string, parent: string | null = null, isInternal = false) {
  return { key, title: key.toUpperCase(), internal: isInternal, parent }
}

/** Stages in workflow order: `a` with two children, an internal `b` with a child, and `e`. */
export const nestedStages = [
  stage('a'),
  stage('a1', 'a'),
  stage('a2', 'a'),
  stage('b', null, true),
  stage('b1', 'b'),
  stage('c', null, true),
  stage('e'),
]

/** The tree of `nestedStages`: an internal stage goes with the stages under it. */
export const expectedVisibleStages = [
  {
    key: 'a',
    title: 'A',
    children: [
      { key: 'a1', title: 'A1', children: [] },
      { key: 'a2', title: 'A2', children: [] },
    ],
  },
  { key: 'e', title: 'E', children: [] },
]

/** A stage of `nestedStages`, and the title that the user reads for a run in it. */
export const visibleTitleCases = [
  { name: 'a stage the user sees', stage: 'a2', title: 'A2' },
  { name: 'an internal stage after a stage the user sees', stage: 'b', title: 'A2' },
  { name: 'two internal stages in a row', stage: 'c', title: 'A2' },
  { name: 'a stage that is not there', stage: 'nothing', title: null },
]
