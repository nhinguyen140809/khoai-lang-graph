/** The interrupts of run 3 of the mentor thread, by the scenario of the run status. */
export const run3InterruptCases = [
  {
    name: 'waits at the analysis review',
    address: '/',
    interrupts: [
      { node: 'checkpoint_personas', status: 'resolved' },
      { node: 'checkpoint_analysis', status: 'pending' },
    ],
  },
  {
    name: 'runs at the analysis',
    address: '/?mock-run-status=running',
    interrupts: [{ node: 'checkpoint_personas', status: 'resolved' }],
  },
  {
    name: 'failed at the analysis',
    address: '/?mock-run-status=failed',
    interrupts: [{ node: 'checkpoint_personas', status: 'resolved' }],
  },
  {
    name: 'went through the whole workflow',
    address: '/?mock-run-status=done',
    interrupts: [
      { node: 'checkpoint_personas', status: 'resolved' },
      { node: 'checkpoint_analysis', status: 'resolved' },
      { node: 'checkpoint_spec', status: 'resolved' },
    ],
  },
]

/** What `?mock-agent-questions` asks of the pending interrupt of a run. */
export const agentQuestionCases = [
  {
    name: 'an interrupt that only asks questions',
    address: '/?mock-agent-questions=only',
    prompt:
      'Before I plan the interviews, tell me who will use the platform and what the first version must take care of.',
    options: [],
    questions: ['users', 'payments', 'sessions_per_week', 'notes'],
  },
]
