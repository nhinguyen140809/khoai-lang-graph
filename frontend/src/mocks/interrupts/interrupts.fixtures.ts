import type { InterruptQuestion } from '@/modules/review/entities'

// The questions that an agent adds at run time to the pending interrupt of a run. The checkpoints
// of the definition ask none, so the `?mock-agent-questions` scenario shows these instead.

/** What an interrupt that only asks questions asks, in the words of the agent that asks. */
export const agentQuestionsPromptFixture = 'A few details before the plan is made.'

/** The questions an agent adds at run time: who uses the product, and what to keep in mind. */
export const agentQuestionFixtures: InterruptQuestion[] = [
  {
    key: 'users',
    type: 'multi_select',
    prompt: 'Who will use the platform?',
    required: true,
    choices: [
      { key: 'students', label: 'Students', requires_text: false },
      { key: 'mentors', label: 'Mentors', requires_text: false },
      { key: 'other', label: 'Someone else, please specify', requires_text: true },
    ],
    min_selected: 1,
    max_selected: null,
    default_answer: { choice_keys: ['students', 'mentors'], text: null, number: null },
    source: 'agent',
  },
  {
    key: 'payments',
    type: 'single_select',
    prompt: 'Should the first version take payments?',
    required: true,
    choices: [
      { key: 'yes', label: 'Yes', requires_text: false },
      { key: 'no', label: 'No', requires_text: false },
    ],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: ['no'], text: null, number: null },
    source: 'agent',
  },
  {
    key: 'sessions_per_week',
    type: 'number',
    prompt: 'How many sessions should a mentor offer per week?',
    required: false,
    choices: [],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: [], text: null, number: 2 },
    source: 'agent',
  },
  {
    key: 'notes',
    type: 'free_text',
    prompt: 'Anything else the agents should know?',
    required: false,
    choices: [],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: [], text: null, number: null },
    source: 'agent',
  },
]
