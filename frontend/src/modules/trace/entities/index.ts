export { getArtifactTrace, getItemTrace } from './chains/chains.api'
export { chainKeys } from './chains/chains.keys'
export type {
  ItemLinkGroup,
  ItemLinkRow,
  LinkQuote,
  Trace,
  TraceDirection,
  TraceItem,
  TraceQuery,
} from './chains/chains.types'
export { traceDirections } from './chains/chains.types'
export { itemLinkGroups, linkQuotesByItem, outOfDateItemIds } from './chains/chains.utils'
export {
  useArtifactTrace,
  useItemTrace,
  useLinkQuotesOf,
  useOutOfDateItemIds,
  useReloadTraces,
} from './chains/hooks/useChainQueries'
export { actGapKeys, isActGap, itemAttention, linkAttention } from './graph/attention.utils'
export { useItemChain, useTraceAttention } from './graph/hooks/useGraphQueries'
export { chainDepth } from './graph/trace-graph.constants'
export type {
  AttentionContext,
  AttentionItem,
  ChainContext,
  ChainEdgeData,
  ChainGraph,
  ChainNodeData,
  ItemAttention,
  ItemChainResult,
  TraceAttentionResult,
} from './graph/trace-graph.types'
export { chainGraphOf } from './graph/trace-graph.utils'
export { useOpenIssues } from './issues/hooks/useOpenIssues'
export { issueKeys } from './issues/issues.keys'
export type {
  IssueContext,
  OpenIssueEntry,
  OpenIssueGroup,
  OpenIssuesResult,
} from './issues/open-issues.types'
export { openIssueEntries } from './issues/open-issues.utils'
export { LinkedItemsPopover } from './item-links/components/LinkedItemsPopover'
export { QuotedWordsPopover } from './item-links/components/QuotedWordsPopover'
export { useItemLinks } from './item-links/hooks/useItemLinks'
export type { ItemLinksResult, LinkedEntry, LinkMarkRange } from './item-links/item-links.types'
export { quoteMarkColors } from './item-links/link-marks.constants'
export { fieldMarksOf, markRangesOf } from './item-links/link-marks.utils'
export { linkedItemMessages } from './item-links/linked-items.constants'
export { useLinkTargets } from './links/hooks/useLinkTargets'
export { useLinksCiting, useProjectTraceLinks } from './links/hooks/useTraceLinkQueries'
export { createTraceLink, deleteTraceLink, listProjectTraceLinks } from './links/trace-links.api'
export {
  derivedFrom,
  evidencedBy,
  linkTargetsPageSize,
  linkTypeWords,
} from './links/trace-links.constants'
export { traceLinkKeys } from './links/trace-links.keys'
export type {
  CreateTraceLinkBody,
  LinkSentenceTense,
  TraceLink,
  TraceLinkFilters,
} from './links/trace-links.types'
export {
  hasALinkTo,
  isLinkOutOfDate,
  linkKeyOf,
  linkSentence,
  linkSentenceParts,
  parseLinkKey,
} from './links/trace-links.utils'
export { liveTraceMs } from './live-trace.constants'
export type { LiveTraceOptions } from './live-trace.types'
export { traceModuleKeys } from './trace-module.keys'
export {
  useTraceabilityCoverage,
  useTraceabilityMatrix,
} from './traceability/hooks/useTraceabilityQueries'
export { getTraceabilityCoverage, getTraceabilityMatrix } from './traceability/traceability.api'
export { traceabilityKeys } from './traceability/traceability.keys'
export type {
  ChangedTarget,
  Coverage,
  CoverageItem,
  ItemSummary,
  Matrix,
} from './traceability/traceability.types'
