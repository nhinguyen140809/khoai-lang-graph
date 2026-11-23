'use client'

import { PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Menu, MenuContent, MenuTrigger } from '@/shared/components/menu'
import { Button } from '@/shared/components/ui/button'

import { promptMessages } from '../prompt.constants'

/**
 * The plus of the box of the prompt: a menu of what can be added to the text, such as a file. It
 * opens above the plus on a wide screen and as a sheet from the foot of the screen on a narrow
 * one. The items are the owner's, made with `MenuItem`.
 */
export function PromptAddMenu({ children }: { children: ReactNode }) {
  return (
    <Menu>
      <MenuTrigger>
        <Button
          type="button"
          variant="ghost"
          color="neutral"
          size="icon-sm"
          aria-label={promptMessages.add}
        >
          <PlusIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuContent title={promptMessages.add} side="top" align="end" className="w-56">
        {children}
      </MenuContent>
    </Menu>
  )
}
