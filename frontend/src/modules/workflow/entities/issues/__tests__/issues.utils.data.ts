/** The kinds of item the definition lists, and the issue kinds that come out of them. */
export const issueKindCases = [
  {
    name: 'the item kinds that name a status field',
    itemKinds: [
      { kind: 'section', schema_version: 1, issue: null },
      {
        kind: 'conflict',
        schema_version: 1,
        issue: {
          status_field: 'status',
          open_values: ['open'],
          about_link_types: ['concerns'],
          party_link_types: ['involves'],
        },
      },
      {
        kind: 'doubt',
        schema_version: 2,
        issue: {
          status_field: 'state',
          open_values: ['raised', 'reopened'],
          about_link_types: ['flags'],
          party_link_types: [],
        },
      },
    ],
    expected: [
      { kind: 'conflict', statusField: 'status', openValues: ['open'] },
      { kind: 'doubt', statusField: 'state', openValues: ['raised', 'reopened'] },
    ],
  },
  {
    name: 'no issue kind when no item kind records a problem',
    itemKinds: [{ kind: 'section', schema_version: 1, issue: null }],
    expected: [],
  },
]

/** The item kinds the definition lists, and the link types of the issues of each issue kind. */
export const issueLinkTypeCases = [
  {
    name: 'the link types that each issue kind names',
    itemKinds: issueKindCases[0]?.itemKinds ?? [],
    expected: {
      conflict: { about: ['concerns'], parties: ['involves'] },
      doubt: { about: ['flags'], parties: [] },
    },
  },
  {
    name: 'no kind when no item kind records a problem',
    itemKinds: [{ kind: 'section', schema_version: 1, issue: null }],
    expected: {},
  },
]

const kinds = [
  { kind: 'conflict', statusField: 'status', openValues: ['open'] },
  { kind: 'doubt', statusField: 'state', openValues: ['raised', 'reopened'] },
]

/** An item and the issue kinds, and whether the item is an issue that is still open. */
export const openIssueCases = [
  {
    name: 'an issue whose status is an open value',
    item: { kind: 'conflict', content: { status: 'open' } },
    expected: true,
  },
  {
    name: 'an issue whose status is another value',
    item: { kind: 'conflict', content: { status: 'resolved' } },
    expected: false,
  },
  {
    name: 'an issue of a kind that names another field and value',
    item: { kind: 'doubt', content: { state: 'raised' } },
    expected: true,
  },
  {
    name: 'an issue whose status is another of the open values',
    item: { kind: 'doubt', content: { state: 'reopened' } },
    expected: true,
  },
  {
    name: 'an issue that has no value in its status field',
    item: { kind: 'doubt', content: {} },
    expected: false,
  },
  {
    name: 'an item of a kind that records no problem',
    item: { kind: 'persona', content: { status: 'open' } },
    expected: false,
  },
].map((openIssueCase) => ({ ...openIssueCase, kinds }))
