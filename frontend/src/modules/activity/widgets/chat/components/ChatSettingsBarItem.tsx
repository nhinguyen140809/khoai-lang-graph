'use client'

import { useActivityThread } from '@/modules/activity/entities'
import { ChooseRunSettingsButton } from '@/modules/activity/features/choose-run-settings'
import { DeskBarItem, DeskBarSide } from '@/shared/components/frame'

/** After the other items of the right side of the bar, such as the export. */
const settingsOrder = 10

/**
 * The settings of the run that the next message of the chat starts, as an icon in the bar of the
 * desk, the last of its right side: before the account where the desk has one, else outermost. It shows only while the project has a chat to choose them for.
 */
export function ChatSettingsBarItem({ projectId }: { projectId: string }) {
  const thread = useActivityThread(projectId)
  if (thread.state !== 'success' || thread.thread === null) return null

  return (
    <DeskBarItem side={DeskBarSide.Right} order={settingsOrder}>
      <ChooseRunSettingsButton thread={thread.thread} display="icon" />
    </DeskBarItem>
  )
}
