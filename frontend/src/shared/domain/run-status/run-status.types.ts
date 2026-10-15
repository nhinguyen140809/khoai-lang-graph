import type { runStatuses, unfinishedRunStatuses } from './run-status.constants'

export type RunStatus = (typeof runStatuses)[number]

export type UnfinishedRunStatus = (typeof unfinishedRunStatuses)[number]
