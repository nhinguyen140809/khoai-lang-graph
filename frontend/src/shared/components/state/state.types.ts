/**
 * `compact` fits narrow containers such as the sidebar. `page` fills the container it is in and
 * puts the state in the middle of it, horizontally and vertically.
 */
export type StateSize = 'compact' | 'page'

/**
 * The shape of the placeholder while content loads, to match the content it stands in for:
 * `lines` text rows, `list` rows with a mark and two lines, `cards` boxes with a title and text,
 * `grid` blocks in columns, `table` rows of cells, `feed` entries with an avatar, `document` a
 * heading over paragraphs, and `detail` a title, small tags and sections.
 */
export type LoadingLayout =
  'lines' | 'list' | 'cards' | 'grid' | 'table' | 'feed' | 'document' | 'detail'
