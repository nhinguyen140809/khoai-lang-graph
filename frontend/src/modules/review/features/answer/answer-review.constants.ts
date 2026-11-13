import type { Hotkey } from '@/shared/lib/hotkey'

/** The words of the action of answering a review. */
export const answerReviewMessages = {
  sent: 'Your answer is sent.',
  notSent: 'The answer was not sent.',
  send: 'Send',
  sendAnswers: 'Send answers',
  sending: 'Sending the answer',
  choice: 'Your choice',
  feedbackPlaceholder: 'Describe what should change; the agents read this before they continue.',
  feedbackFor: (label: string) => `Feedback for "${label}"`,
  asksForDescription: 'This choice needs a short description from you.',
  previous: 'Previous step',
  next: 'Next step',
  step: (current: number, count: number) => `${String(current)} / ${String(count)}`,
  /** One function for each type of problem of an answer, which gives it its count or its label. */
  problems: {
    chooseOne: () => 'Choose one.',
    chooseAtLeast: ({ count }: { count: number }) => `Choose at least ${String(count)}.`,
    chooseAtMost: ({ count }: { count: number }) => `Choose at most ${String(count)}.`,
    writeAnswer: () => 'Write an answer.',
    enterNumber: () => 'Enter a number.',
    explainChoice: ({ label }: { label: string }) => `Explain the choice "${label}".`,
  },
  writeFeedback: 'Write the feedback.',
  chooseOption: 'Choose an option.',
  agentAsks: 'The agents also ask:',
} as const

/** The keys that send the answer from a box of the form: Ctrl or Cmd+Enter. */
export const sendFeedbackHotkey = { key: 'Enter', mod: true } as const satisfies Hotkey

/** What each arrow key does on the steps of the answer: go to another step or to another answer. */
export const answerStepKeys = {
  ArrowLeft: { kind: 'step', by: -1 },
  ArrowRight: { kind: 'step', by: 1 },
  ArrowUp: { kind: 'answer', by: -1 },
  ArrowDown: { kind: 'answer', by: 1 },
} as const
