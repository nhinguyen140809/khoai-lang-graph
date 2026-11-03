/** A node id and the kind of node it names, or null when the definition has no such node. */
export const nodeCases = [
  { name: 'the start node', nodeId: '__start__', kind: 'start' },
  { name: 'an agent node', nodeId: 'planner', kind: 'agent' },
  { name: 'a checkpoint node', nodeId: 'checkpoint_analysis', kind: 'checkpoint' },
  { name: 'a node that is not there', nodeId: 'nothing', kind: null },
]

/** A node, and the targets of the edges that leave it, in the order of the definition. */
export const edgeCases = [
  { name: 'the start node', nodeId: '__start__', targets: ['planner', 'intent_router'] },
  {
    name: 'a checkpoint with three options',
    nodeId: 'checkpoint_analysis',
    targets: ['requirement_engineer', 'analyst', 'rework_elicitation'],
  },
  { name: 'a node that is not there', nodeId: 'nothing', targets: [] },
]

/** A value list, and the keys of its values, or null when the definition has no such list. */
export const valueListCases = [
  { name: 'the priorities', key: 'priority', values: ['must', 'should', 'could', 'wont'] },
  { name: 'a list that is not there', key: 'nothing', values: null },
]
