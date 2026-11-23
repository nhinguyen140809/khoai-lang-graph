'use client'

import { PanelsTopLeftIcon, SettingsIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { settingsPages, useChooseView, viewLabels } from '@/modules/user/features/view'
import { type PaletteCommand, PaletteGroup } from '@/shared/components/frame'
import { useCommands } from '@/shared/lib/commands'
import { useView, views } from '@/shared/lib/view'
import { useViewStartHref } from '@/shared/routes'

import { accountCommandMessages } from './account-commands.constants'

/**
 * Registers the commands that both views have: opening the settings, and switching to each view
 * other than the one on show, which saves the choice and opens that view. They list in the palette
 * beside the commands that only one view registers, such as the panels of the workbench.
 */
export function AccountCommands() {
  const router = useRouter()
  const view = useView()
  const chooseView = useChooseView()
  const startHref = useViewStartHref()

  const commands: PaletteCommand[] = [
    {
      id: 'account.settings',
      label: accountCommandMessages.settings,
      group: accountCommandMessages.group,
      icon: <SettingsIcon />,
      run: () => {
        router.push(settingsPages[view]())
      },
    },
    ...views
      .filter((other) => other !== view)
      .map((other) => ({
        id: `view.switch.${other}`,
        label: accountCommandMessages.switchTo(viewLabels[other]),
        group: PaletteGroup.View,
        icon: <PanelsTopLeftIcon />,
        run: () => {
          chooseView.mutate({ view: other, href: startHref(other) })
        },
      })),
  ]
  useCommands(commands)

  return null
}
