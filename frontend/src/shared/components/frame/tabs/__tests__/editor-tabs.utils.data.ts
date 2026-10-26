/** A record of tab ids by group, the group and tab set, and the record after it. */
export const setGroupTabCases = [
  {
    name: 'a group without a tab',
    record: { a: 't1' },
    group: 'b',
    tabId: 't2',
    result: { a: 't1', b: 't2' },
    same: false,
  },
  {
    name: 'a group with another tab',
    record: { a: 't1' },
    group: 'a',
    tabId: 't2',
    result: { a: 't2' },
    same: false,
  },
  {
    name: 'a group that has the tab already',
    record: { a: 't1' },
    group: 'a',
    tabId: 't1',
    result: { a: 't1' },
    same: true,
  },
] as const

/** A record of tab ids by group, the group and tab cleared, and the record after it. */
export const clearGroupTabCases = [
  {
    name: 'a group that holds the tab',
    record: { a: 't1', b: 't2' },
    group: 'a',
    tabId: 't1',
    result: { b: 't2' },
    same: false,
  },
  {
    name: 'a group that holds another tab',
    record: { a: 't1' },
    group: 'a',
    tabId: 't2',
    result: { a: 't1' },
    same: true,
  },
  {
    name: 'a group without a tab',
    record: { a: 't1' },
    group: 'z',
    tabId: 't1',
    result: { a: 't1' },
    same: true,
  },
] as const
