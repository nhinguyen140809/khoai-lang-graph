/** A body that is right, and the choices it gives; a temperature left out is null. */
export const choiceCases = [
  {
    name: 'two roles',
    body: {
      items: [
        { agent_role: 'analyst', model_id: 'openai:gpt-4.1', temperature: 0.5 },
        { agent_role: 'planner', model_id: 'anthropic:claude-haiku-5' },
      ],
    },
    choices: [
      { agent_role: 'analyst', model_id: 'openai:gpt-4.1', temperature: 0.5 },
      { agent_role: 'planner', model_id: 'anthropic:claude-haiku-5', temperature: null },
    ],
  },
  { name: 'no role, every role on the default', body: { items: [] }, choices: [] },
  {
    name: 'the limits of the temperature',
    body: {
      items: [
        { agent_role: 'analyst', model_id: 'openai:gpt-4.1', temperature: 0 },
        { agent_role: 'planner', model_id: 'openai:gpt-4.1', temperature: 1 },
        { agent_role: 'validator', model_id: 'openai:gpt-4.1', temperature: null },
      ],
    },
    choices: [
      { agent_role: 'analyst', model_id: 'openai:gpt-4.1', temperature: 0 },
      { agent_role: 'planner', model_id: 'openai:gpt-4.1', temperature: 1 },
      { agent_role: 'validator', model_id: 'openai:gpt-4.1', temperature: null },
    ],
  },
]

const analyst = { agent_role: 'analyst', model_id: 'openai:gpt-4.1' }

/** A body that is wrong, and the problems it gives. */
export const problemCases = [
  {
    name: 'no items',
    body: {},
    problems: [{ field: 'items', message: 'This field is required.' }],
  },
  {
    name: 'items that is not a list',
    body: { items: 'analyst' },
    problems: [{ field: 'items', message: 'Send a value of type array.' }],
  },
  {
    name: 'an entry that is not an object',
    body: { items: ['analyst'] },
    problems: [{ field: 'items.0', message: 'Send a value of type object.' }],
  },
  {
    name: 'an entry without a model',
    body: { items: [{ agent_role: 'analyst' }] },
    problems: [{ field: 'items.0.model_id', message: 'This field is required.' }],
  },
  {
    name: 'a field that is not allowed',
    body: { items: [{ ...analyst, color: 'red' }] },
    problems: [{ field: 'items.0.color', message: 'This field is not allowed.' }],
  },
  {
    name: 'a role that is not one of the definition',
    body: { items: [{ ...analyst, agent_role: 'chef' }] },
    problems: [{ field: 'items.0.agent_role', message: 'Choose one of the values.' }],
  },
  {
    name: 'a role given twice',
    body: { items: [analyst, analyst] },
    problems: [{ field: 'items.1.agent_role', message: 'Give each role once.' }],
  },
  {
    name: 'a model that does not serve its role',
    body: { items: [{ ...analyst, model_id: 'openai:gpt-4.1-mini' }] },
    problems: [{ field: 'items.0.model_id', message: 'Choose one of the values.' }],
  },
  {
    name: 'a temperature above 1',
    body: { items: [{ ...analyst, temperature: 1.5 }] },
    problems: [{ field: 'items.0.temperature', message: 'Send 1 or less.' }],
  },
  {
    name: 'a temperature below 0',
    body: { items: [{ ...analyst, temperature: -0.1 }] },
    problems: [{ field: 'items.0.temperature', message: 'Send 0 or more.' }],
  },
  {
    name: 'a temperature that is not a number',
    body: { items: [{ ...analyst, temperature: 'hot' }] },
    problems: [{ field: 'items.0.temperature', message: 'Send a value of type number or null.' }],
  },
]
