import type { OutlineNeighbors } from '@/modules/artifact/entities'
import { PaletteGroup, useCommands } from '@/shared/components/frame'

import { itemPageMessages } from '../item-page.constants'
import type { ItemMove } from '../item-page.types'

/**
 * Registers `J` and `K` for the item page while it is on screen: the next and the previous item of
 * the document, opened in the tab on screen by `move`. `onMoved` runs after either, as the
 * navigator shows itself again.
 */
export function useItemCommands(
  neighbors: OutlineNeighbors,
  move: (target: { id: string }, move: ItemMove) => void,
  onMoved: () => void,
  { isEnabled = true }: { isEnabled?: boolean } = {},
) {
  const command = ({
    id,
    label,
    key,
    target,
    direction,
  }: {
    id: string
    label: string
    key: string
    target: { id: string } | null
    direction: ItemMove
  }) => ({
    id,
    label,
    group: PaletteGroup.View,
    hotkey: { key },
    ...(target !== null && {
      run: () => {
        move(target, direction)
        onMoved()
      },
    }),
  })

  useCommands(
    isEnabled
      ? [
          command({
            id: 'documents.nextItem',
            label: itemPageMessages.next,
            key: 'j',
            target: neighbors.next,
            direction: 'next',
          }),
          command({
            id: 'documents.previousItem',
            label: itemPageMessages.previous,
            key: 'k',
            target: neighbors.previous,
            direction: 'previous',
          }),
        ]
      : [],
  )
}
