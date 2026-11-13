import type { LoadingLayout } from '../state.types'
import { cardsStrategy } from './CardsStrategy'
import { detailStrategy } from './DetailStrategy'
import { documentStrategy } from './DocumentStrategy'
import { feedStrategy } from './FeedStrategy'
import { gridStrategy } from './GridStrategy'
import { linesStrategy } from './LinesStrategy'
import { listStrategy } from './ListStrategy'
import type { LoadingStrategy } from './loading.types'
import { tableStrategy } from './TableStrategy'

/** The strategy of each layout: the state picks one by name and draws with it. */
export const loadingStrategies: Record<LoadingLayout, LoadingStrategy> = {
  lines: linesStrategy,
  list: listStrategy,
  cards: cardsStrategy,
  grid: gridStrategy,
  table: tableStrategy,
  feed: feedStrategy,
  document: documentStrategy,
  detail: detailStrategy,
}
