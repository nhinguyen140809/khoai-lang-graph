'use client'

import { useAttachedSources } from '@/modules/source/entities'
import { PromptAddMenu } from '@/shared/components/prompt'

import { PickSourceItem } from './PickSourceItem'

/** The part of a prompt that chooses files as sources of a project that does not exist yet: the plus, with its menu. */
export function AttachSourceMenu() {
  const { add } = useAttachedSources()

  return (
    <PromptAddMenu>
      <PickSourceItem onPick={add} />
    </PromptAddMenu>
  )
}
