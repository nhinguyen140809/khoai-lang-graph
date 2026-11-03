/** A body of POST /threads/{thread_id}/messages that the mock accepts, and the message it reads. */
export const sentMessageCases = [
  {
    name: 'the body of the API example',
    body: {
      content: 'I want to build an online platform for university students to find mentors.',
    },
    message: {
      content: 'I want to build an online platform for university students to find mentors.',
    },
  },
  {
    name: 'run settings',
    body: { content: 'Hi', run_config: { max_steps: 40 } },
    message: {
      content: 'Hi',
      runDefaults: {
        review_checkpoints: null,
        max_steps: 40,
        max_cost_usd: null,
        parameters: null,
      },
    },
  },
  {
    name: 'models by agent role',
    body: { content: 'Hi', models: { analyst: 'anthropic:claude-sonnet-5' } },
    message: { content: 'Hi', models: { analyst: 'anthropic:claude-sonnet-5' } },
  },
]

/** A body of POST /threads/{thread_id}/messages that the mock refuses, and its problems. */
export const sentMessageProblemCases = [
  {
    name: 'no content',
    body: {},
    problems: [{ field: 'content', message: 'Enter a value.' }],
  },
  {
    name: 'a blank content',
    body: { content: ' ' },
    problems: [{ field: 'content', message: 'Enter a value.' }],
  },
  {
    name: 'a content that is not text',
    body: { content: 3 },
    problems: [{ field: 'content', message: 'Enter a value.' }],
  },
  {
    name: 'run settings with a field of the wrong type',
    body: { content: 'Hi', run_config: { max_steps: 'five' } },
    problems: [{ field: 'run_config.max_steps', message: 'Send a value of type integer or null.' }],
  },
  {
    name: 'models that is not an object',
    body: { content: 'Hi', models: 'sonnet' },
    problems: [{ field: 'models', message: 'Send an object.' }],
  },
  {
    name: 'a model of a role that is not one of the definition',
    body: { content: 'Hi', models: { chef: 'anthropic:claude-sonnet-5' } },
    problems: [{ field: 'models.chef', message: 'Choose one of the values.' }],
  },
  {
    name: 'a model that does not serve its role',
    body: { content: 'Hi', models: { analyst: 'openai:gpt-4.1-mini' } },
    problems: [{ field: 'models.analyst', message: 'Choose one of the values.' }],
  },
  {
    name: 'a model that the catalog does not hold',
    body: { content: 'Hi', models: { analyst: 'acme:magic' } },
    problems: [{ field: 'models.analyst', message: 'Choose one of the values.' }],
  },
  {
    name: 'a model without a value',
    body: { content: 'Hi', models: { analyst: ' ' } },
    problems: [{ field: 'models.analyst', message: 'Enter a value.' }],
  },
  {
    name: 'a blank content and models that is not an object',
    body: { content: ' ', models: 'sonnet' },
    problems: [
      { field: 'content', message: 'Enter a value.' },
      { field: 'models', message: 'Send an object.' },
    ],
  },
]
