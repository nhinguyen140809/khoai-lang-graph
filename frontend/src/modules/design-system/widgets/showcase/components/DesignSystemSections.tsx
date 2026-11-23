import type { SectionId } from '../design-system.types'
import { CardAnchor } from './CardAnchor'
import { cards } from './cards'
import { Masonry } from './Masonry'

/**
 * The cards of a tab, packed in a grid by the columns each one takes and by its height. `focus`
 * names a card that the search chose, which scrolls into view and is marked.
 */
export function SectionCards({ section, focus }: { section: SectionId; focus: string | null }) {
  return (
    <Masonry>
      {cards
        .filter((card) => card.section === section)
        .map(({ id, span, View }) => (
          <CardAnchor key={id} id={id} focused={focus === id} span={span}>
            <View />
          </CardAnchor>
        ))}
    </Masonry>
  )
}
