import { SquareIcon } from 'lucide-react'
import { createElement } from 'react'

import type { Run } from '@/modules/run/entities'
import { useCommands } from '@/shared/components/frame'

import { stopRunMessages } from '../stop-run.constants'
import { stoppableRun } from '../stop-run.utils'
import { useOpenStopRunDialog } from './useOpenStopRunDialog'

/** Offers Stop run in the command palette while the given run has not finished. */
export function useStopRunCommand(run: Run | null) {
  const stoppable = stoppableRun(run)
  const openDialog = useOpenStopRunDialog()

  useCommands(
    stoppable === null
      ? []
      : [
          {
            id: 'run.stop',
            label: stopRunMessages.stopRun,
            group: stopRunMessages.commandGroup,
            icon: createElement(SquareIcon),
            variant: 'destructive',
            run: () => {
              openDialog(stoppable.id)
            },
          },
        ],
  )
}
