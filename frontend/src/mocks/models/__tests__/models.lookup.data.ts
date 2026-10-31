const everyModel = [
  'anthropic:claude-haiku-5',
  'anthropic:claude-opus-5',
  'anthropic:claude-sonnet-5',
  'local:llama-3.3-70b',
  'openai:gpt-4.1',
  'openai:gpt-4.1-mini',
]

/** An agent role, the models that serve it, and the ones that do not. */
export const roleCases = [
  {
    name: 'the analyst without the light models',
    role: 'analyst',
    ids: ['anthropic:claude-opus-5', 'anthropic:claude-sonnet-5', 'openai:gpt-4.1'],
    absent: ['anthropic:claude-haiku-5', 'openai:gpt-4.1-mini', 'local:llama-3.3-70b'],
  },
  { name: 'the interviewer with every model', role: 'interviewer', ids: everyModel, absent: [] },
  { name: 'no model for a role that is not known', role: 'chef', ids: [], absent: everyModel },
]
