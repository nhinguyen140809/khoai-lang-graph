/** What `?mock-agent-questions` asks of the pending interrupt of a run. */
export const agentQuestionModes = ['only'] as const

export type AgentQuestionMode = (typeof agentQuestionModes)[number]
