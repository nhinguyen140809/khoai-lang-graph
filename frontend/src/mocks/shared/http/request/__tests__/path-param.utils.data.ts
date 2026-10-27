/** The parameters a handler matched, the name asked for, and the value read. */
export const pathParamCases = [
  { name: 'an id', params: { projectId: 'p1' }, param: 'projectId', value: 'p1' },
  {
    name: 'one of two ids',
    params: { itemId: 'i1', artifactId: 'a1' },
    param: 'artifactId',
    value: 'a1',
  },
  { name: 'a number written as text', params: { version: '2' }, param: 'version', value: '2' },
  { name: 'a path that matched a list', params: { rest: ['a', 'b'] }, param: 'rest', value: 'a,b' },
]
