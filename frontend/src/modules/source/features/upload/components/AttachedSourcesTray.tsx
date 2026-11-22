'use client'

import { useAttachedSources } from '@/modules/source/entities'
import { PromptAttachments } from '@/shared/components/prompt'
import { useBeforeUnload } from '@/shared/lib/unload'

import { AttachedSources } from './AttachedSources'

/** The part of a prompt that lists the files chosen as sources, with a button on each that takes it off; put it above the text. */
export function AttachedSourcesTray() {
  const { files, remove } = useAttachedSources()
  // A file cannot be kept in the browser, so a reload would lose the ones that are chosen.
  useBeforeUnload(files.length > 0)

  return (
    <PromptAttachments isPresent={files.length > 0}>
      <AttachedSources files={files} onRemove={remove} />
    </PromptAttachments>
  )
}
