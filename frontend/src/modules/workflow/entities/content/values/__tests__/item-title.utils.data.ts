/** What an item is called, by the schema of its kind. */
export const itemTitleCases = [
  {
    name: 'its title field',
    kind: 'spec_requirement',
    item: { key: 'REQ-001', content: { title: 'Search mentors' } },
    title: 'Search mentors',
  },
  {
    name: 'its key when the title field is empty',
    kind: 'spec_requirement',
    item: { key: 'REQ-002', content: {} },
    title: 'REQ-002',
  },
  {
    name: 'its key when the title field is spaces',
    kind: 'spec_requirement',
    item: { key: 'REQ-003', content: { title: '  ' } },
    title: 'REQ-003',
  },
  {
    name: 'its key when the kind has no schema',
    kind: null,
    item: { key: 'X-1', content: { title: 'x' } },
    title: 'X-1',
  },
]
