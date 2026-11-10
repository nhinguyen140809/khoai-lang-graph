/** The reviews, by the node that asks for them, that a run can be set to stop at. */
export const reviewNodes = {
  personas: 'checkpoint_personas',
  analysis: 'checkpoint_analysis',
  specification: 'checkpoint_spec',
} as const

/**
 * The reviews of a run that stops at all of them, in the order it reaches them: what the status bar
 * says while it waits, what the chat asks, and the option of the review that approves.
 */
export const reviewsInOrder = [
  {
    node: reviewNodes.personas,
    status: 'Finalizing the interviewees',
    prompt: 'Review the personas. Edit them if needed, then approve them.',
    approve: 'Approve the interviewees',
    approveKey: 'approve',
  },
  {
    node: reviewNodes.analysis,
    status: 'Reviewing the analysis',
    prompt: 'Review the requirements analysis. Accept it, or reject it with feedback.',
    approve: 'Approve analysis',
    approveKey: 'accept',
  },
  {
    node: reviewNodes.specification,
    status: 'Reviewing the specification',
    prompt: 'Review the requirement specification. Mark it OK, or not OK with feedback.',
    approve: 'Approve the specification',
    approveKey: 'ok',
  },
] as const
